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
import { setLoadingModalError } from '../../store/slices/uiSlice';
import { setStoredDispatch } from '../../store/shapes/ui';
import { EBackupPreference } from '../../types/pubky';
import { handleAuthAction } from './authAction';
import { SHEET_ANIMATION_DELAY } from '../constants.ts';
import i18n from '../../i18n';
import { SheetManager } from 'react-native-actions-sheet';
import { Dispatch } from 'redux';
import { getSignedUpPubkysFromStore } from '../store-helpers';
import { showPubkySelectionSheet } from '../../hooks/inputHandlerUtils';

type SignupActionData = {
	action: InputAction.Signup;
	params: SignupParams;
};

/**
 * Transitions the loading modal to error state via Redux
 */
const showErrorState = (errorMessage: string, dispatch: Dispatch): void => {
	// Store dispatch for use in "Try again" button
	setStoredDispatch(dispatch);
	// Update Redux state to show error
	dispatch(setLoadingModalError({
		isError: true,
		errorMessage: errorMessage,
	}));
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

	// Show loading modal (don't await - it resolves when sheet closes)
	SheetManager.show('loading', {
		payload: {
			modalTitle: i18n.t('loading.modalTitle'),
		},
	});

	try {
		// Step 1: Generate a new keypair
		const genKeyRes = await generateMnemonicPhraseAndKeypair();
		if (genKeyRes.isErr()) {
			showErrorState(i18n.t('signup.failedToGenerateKeypair'), dispatch);
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
			showErrorState(i18n.t('pubkyErrors.failedToSavePubky'), dispatch);
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
			// Check if user has existing signed-up pubkys - if so, forward to auth
			const signedUpPubkys = getSignedUpPubkysFromStore();
			const signedUpKeys = Object.keys(signedUpPubkys);

			if (signedUpKeys.length > 0) {
				// User has existing pubky(s) - forward to auth flow instead of showing error
				// Hide loading modal first
				await SheetManager.hide('loading');
				await new Promise(resolve => {
					setTimeout(resolve, SHEET_ANIMATION_DELAY);
				});

				const capsString = caps.join(',');
				const authUrl = `pubkyauth:///?relay=${encodeURIComponent(relay)}&secret=${encodeURIComponent(secret)}&caps=${encodeURIComponent(capsString)}`;

				const authData = { action: InputAction.Auth, params: { relay, secret, caps }, rawUrl: authUrl } as const;

				if (signedUpKeys.length === 1) {
					// Single pubky: auto-forward to auth
					return await handleAuthAction(
						authData,
						{ ...context, pubky: signedUpKeys[0], isDeeplink: false }
					);
				} else {
					// Multiple pubkys: show selector, then forward to auth
					return new Promise((resolve) => {
						showPubkySelectionSheet(
							{
								action: InputAction.Auth,
								data: authData,
								source: 'scan',
								rawInput: authUrl,
							},
							'scan',
							dispatch,
							async (selectedPubky: string) => {
								const result = await handleAuthAction(
									authData,
									{ ...context, pubky: selectedPubky, isDeeplink: false }
								);
								resolve(result);
							}
						);
					});
				}
			}

			// No existing pubkys - show error as before
			const errorMessage = getErrorMessage(signupRes.error, i18n.t('errors.signupFailedDescription'));
			showErrorState(errorMessage, dispatch);
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

		// Hide loading modal before showing auth modal
		await SheetManager.hide('loading');

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
		showErrorState(i18n.t('signup.failedToProcessSignup'), dispatch);
		return err(errorMessage);
	} finally {
		// Clear processing state
		if (pubky) {
			dispatch(removeProcessing({ pubky }));
		}
	}
};
