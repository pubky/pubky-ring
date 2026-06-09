/**
 * Signup Action Handler
 *
 * Handles signup deeplinks that create a new pubky and authorize with a service.
 * Format: pubkyauth://signup?hs={homeserver}&st={signup_token}&relay={relay}&secret={secret}&caps={capabilities}
 */

import { Result, ok, err } from '@synonymdev/result';
import { generateMnemonicPhraseAndKeypair } from '@synonymdev/react-native-pubky';
import { InputAction, SignupParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { savePubky, signUpToHomeserver } from '../pubky';
import { checkNetworkConnection, showToast } from '../helpers';
import { getErrorMessage } from '../errorHandler';
import { openXError } from '../xCallback';
import { addProcessing, removeProcessing } from '../../store/slices/pubkysSlice';
import { setLoadingModalError } from '../../store/slices/uiSlice';
import { setStoredDispatch } from '../../store/shapes/ui';
import { EBackupPreference } from '../../types/pubky';
import { handleAuthAction } from './authAction';
import { SHEET_ANIMATION_DELAY } from '../constants.ts';
import { getSignupTokenErrorModalFields, LoadingErrorModalFields } from '../signupErrors';
import i18n from '../../i18n';
import { SheetManager } from 'react-native-actions-sheet';
import { Dispatch } from 'redux';
import {
	getPubkyDataFromStore,
	getPubkyKeyBySignupTokenFromStore,
	getSignedUpPubkysFromStore,
} from '../store-helpers';

type SignupActionData = {
	action: InputAction.Signup;
	params: SignupParams;
};

/**
 * Transitions the loading modal to error state via Redux
 */
const showErrorState = (
	errorMessage: string,
	dispatch: Dispatch,
	fields: LoadingErrorModalFields = {},
): void => {
	// Store dispatch for use in "Try again" button
	setStoredDispatch(dispatch);
	// Update Redux state to show error
	dispatch(
		setLoadingModalError({
			isError: true,
			...fields,
			errorMessage: errorMessage,
		}),
	);
};

/**
 * Handles signup action - creates a new pubky, signs up to homeserver, and initiates auth
 *
 * @returns The created pubky string on success
 */
export const handleSignupAction = async (
	data: SignupActionData,
	context: ActionContext,
): Promise<Result<string>> => {
	const { dispatch } = context;
	const { params } = data;
	const { xCallback, homeserver, inviteCode, relay, secret, caps } = params;

	const isOnline = await checkNetworkConnection({
		dispatch,
		displayToastIfOnline: false,
		displayToastIfOffline: false,
	});
	if (!isOnline) {
		const offlineMessage = i18n.t('network.offlineDescription');
		showToast({
			type: 'error',
			title: i18n.t('network.currentlyOffline'),
			description: offlineMessage,
		});
		await openXError(xCallback, 'OFFLINE', offlineMessage);
		return err(offlineMessage);
	}

	let pubky = '';
	let isReusedPubky = false;
	let secretKey: string | undefined;
	let mnemonic: string | undefined;

	const capsString = caps.join(',');
	const authUrl = `pubkyauth:///?relay=${encodeURIComponent(relay)}&secret=${encodeURIComponent(
		secret,
	)}&caps=${encodeURIComponent(capsString)}`;
	const authData = {
		action: InputAction.Auth,
		params: { relay, secret, caps, xCallback },
		rawUrl: authUrl,
	} as const;

	// Small delay to ensure any previous sheet (e.g., camera) has fully closed
	await new Promise(resolve => setTimeout(resolve, SHEET_ANIMATION_DELAY));

	// If a pubky already exists for this signup token (e.g. user is rescanning the
	// same onboarding QR after a prior failure), reuse it instead of creating a new key.
	const existingPubkyKey = getPubkyKeyBySignupTokenFromStore(inviteCode);
	if (existingPubkyKey) {
		const existingPubky = getPubkyDataFromStore(existingPubkyKey);
		pubky = existingPubkyKey;
		isReusedPubky = true;

		if (existingPubky?.signedUp) {
			// Already signed up to homeserver — skip the loading modal and signup and forward to auth.
			await handleAuthAction(authData, { ...context, pubky, isDeeplink: false });
			return ok(pubky);
		}
	}

	// Show loading modal (don't await - it resolves when sheet closes)
	// This ensures errors are visible via the modal's error state
	SheetManager.show('loading', {
		payload: {
			modalTitle: i18n.t('loading.modalTitle'),
		},
	});

	// Step 1: Generate a new keypair only if we don't have an existing match
	if (!isReusedPubky) {
		const genKeyRes = await generateMnemonicPhraseAndKeypair();
		if (genKeyRes.isErr()) {
			showErrorState(i18n.t('signup.failedToGenerateKeypair'), dispatch);
			await openXError(xCallback, 'SIGNUP_FAILED', i18n.t('signup.failedToGenerateKeypair'));
			return err(i18n.t('signup.failedToGenerateKeypair'));
		}

		const { mnemonic: genMnemonic, secret_key: genSecretKey, public_key: generatedPubky } = genKeyRes.value;
		mnemonic = genMnemonic;
		secretKey = genSecretKey;
		pubky = generatedPubky;
	}

	try {
		// Set processing state
		dispatch(addProcessing({ pubky }));

		// Step 2: Save the pubky to keychain and Redux (new keys only)
		if (!isReusedPubky) {
			const saveRes = await savePubky({
				mnemonic,
				secretKey: secretKey as string,
				pubky,
				dispatch,
				backupPreference: EBackupPreference.unknown,
				isBackedUp: false,
				signupToken: inviteCode,
			});

			if (saveRes.isErr()) {
				showErrorState(i18n.t('pubkyErrors.failedToSavePubky'), dispatch);
				await openXError(xCallback, 'SIGNUP_FAILED', i18n.t('pubkyErrors.failedToSavePubky'));
				return err(i18n.t('pubkyErrors.failedToSavePubky'));
			}
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
			dispatch(removeProcessing({ pubky }));
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
				return await handleAuthAction(authData, { ...context, pubky, isDeeplink: false });
			}

			// No existing pubkys - show error as before
			const errorMessage = getErrorMessage(signupRes.error, i18n.t('errors.signupFailedDescription'));
			showErrorState(errorMessage, dispatch, getSignupTokenErrorModalFields(errorMessage));
			await openXError(xCallback, 'SIGNUP_FAILED', errorMessage);
			return err(errorMessage);
		}

		showToast({
			type: 'success',
			title: i18n.t('signup.signupSuccessful'),
			description: i18n.t('signup.newPubkyCreated'),
		});
		dispatch(removeProcessing({ pubky }));

		// Hide loading modal before showing auth modal
		await SheetManager.hide('loading');

		// Step 4: Trigger auth action with the new pubky
		// Short delay to allow UI to update before showing auth modal
		await new Promise(resolve => {
			setTimeout(resolve, SHEET_ANIMATION_DELAY);
		});

		await handleAuthAction(authData, {
			...context,
			pubky,
			// Don't treat as deeplink for redirect behavior since we want user to stay in app
			isDeeplink: false,
		});

		return ok(pubky);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : i18n.t('errors.unknownError');
		console.error('Error handling signup:', errorMessage);
		showErrorState(i18n.t('signup.failedToProcessSignup'), dispatch);
		await openXError(xCallback, 'SIGNUP_ERROR', errorMessage);
		return err(errorMessage);
	} finally {
		// Clear processing state
		if (pubky) {
			dispatch(removeProcessing({ pubky }));
		}
	}
};
