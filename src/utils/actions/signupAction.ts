/**
 * Signup Action Handler
 *
 * Handles signup deeplinks that create a new pubky and authorize with a service.
 * Format: pubkyauth://signup?hs={homeserver}&ic={invite_code}&relay={relay}&secret={secret}&caps={capabilities}
 */

import { Result, ok, err } from '@synonymdev/result';
import { generateMnemonicPhraseAndKeypair } from '@synonymdev/react-native-pubky';
import { InputAction, SignupParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { savePubky, signUpToHomeserver } from '../pubky';
import { showToast } from '../helpers';
import { getErrorMessage } from '../errorHandler';
import { addProcessing, removeProcessing } from '../../store/slices/pubkysSlice';
import { EBackupPreference } from '../../types/pubky';
import { handleAuthAction } from './authAction';
import { SHEET_ANIMATION_DELAY } from '../constants.ts';
import i18n from '../../i18n';
import { copyToClipboard } from '../clipboard.ts';

type SignupActionData = {
	action: InputAction.Signup;
	params: SignupParams;
};

/**
 * Handles signup action - creates a new pubky, signs up to homeserver, and initiates auth
 *
 * @returns The created pubky string on success
 */
export const handleSignupAction = async (
	data: SignupActionData,
	context: ActionContext
): Promise<Result<string>> => {
	const { dispatch } = context;
	const { params } = data;
	const { homeserver, inviteCode, relay, secret, caps } = params;

	let pubky = '';

	try {
		// Step 1: Generate a new keypair
		const genKeyRes = await generateMnemonicPhraseAndKeypair();
		if (genKeyRes.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('errors.signupFailed'),
				description: i18n.t('signup.failedToGenerateKeypair'),
			});
			return err(i18n.t('signup.failedToGenerateKeypair'));
		}

		const { mnemonic, secret_key: secretKey, public_key: generatedPubky } = genKeyRes.value;
		pubky = generatedPubky;

		// Set processing state
		dispatch(addProcessing({ pubky }));

		// Step 2: Save the pubky to keychain and Redux
		const saveRes = await savePubky({
			mnemonic,
			secretKey,
			pubky,
			dispatch,
			backupPreference: EBackupPreference.unknown,
			isBackedUp: false,
		});

		if (saveRes.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('errors.signupFailed'),
				description: i18n.t('pubkyErrors.failedToSavePubky'),
			});
			return err(i18n.t('pubkyErrors.failedToSavePubky'));
		}

		// Step 3: Sign up to the specified homeserver with invite code
		const signupRes = await signUpToHomeserver({
			pubky,
			secretKey,
			homeserver,
			signupToken: inviteCode,
			dispatch,
		});

		if (signupRes.isErr()) {
			const errorMessage = getErrorMessage(signupRes.error, i18n.t('errors.signupFailedDescription'));
			showToast({
				type: 'error',
				title: i18n.t('common.error'),
				description: errorMessage,
				onPress: () => {
					// Copy debug info to clipboard
					const debugInfo = JSON.stringify({
						error: errorMessage,
						pubky,
						homeserver,
						inviteCode,
					}, null, 2);
					copyToClipboard(debugInfo);
					showToast({
						type: 'info',
						title: i18n.t('common.copied'),
						description: i18n.t('errors.debugInfoCopied'),
					});
				}
			});
			return err(errorMessage);
		}

		showToast({
			type: 'success',
			title: i18n.t('signup.signupSuccessful'),
			description: i18n.t('signup.newPubkyCreated'),
		});

		// Step 4: Construct the pubkyauth URL and trigger auth
		const capsString = caps.join(',');
		const authUrl = `pubkyauth:///?relay=${encodeURIComponent(relay)}&secret=${encodeURIComponent(secret)}&caps=${encodeURIComponent(capsString)}`;

		// Step 5: Trigger auth action with the new pubky
		// Short delay to allow UI to update before showing auth modal
		await new Promise(resolve => {setTimeout(resolve, SHEET_ANIMATION_DELAY);});

		await handleAuthAction(
			{
				action: InputAction.Auth,
				params: { relay, secret, caps },
				rawUrl: authUrl,
			},
			{
				...context,
				pubky,
				// Don't treat as deeplink for redirect behavior since we want user to stay in app
				isDeeplink: false,
			}
		);

		return ok(pubky);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : i18n.t('errors.unknownError');
		console.error('Error handling signup:', errorMessage);
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('signup.failedToProcessSignup'),
		});
		return err(errorMessage);
	} finally {
		// Clear processing state
		if (pubky) {
			dispatch(removeProcessing({ pubky }));
		}
	}
};
