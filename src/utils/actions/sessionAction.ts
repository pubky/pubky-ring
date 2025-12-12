/**
 * Session Action Handler
 *
 * Handles session requests from external apps (e.g., Bitkit).
 * Signs in to the homeserver and returns session data via callback deeplink.
 *
 * Flow:
 * 1. External app sends: pubkyring://session?callback=bitkit://session-data
 * 2. Ring prompts user to select a pubky (handled by useInputHandler)
 * 3. Ring signs in to homeserver
 * 4. Ring opens callback URL with session data: bitkit://session-data?pubky=...&session_secret=...
 */

import { Result, ok, err } from '@synonymdev/result';
import { Linking } from 'react-native';
import { InputAction, SessionParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { signInToHomeserver } from '../pubky';
import { showToast } from '../helpers';
import i18n from '../../i18n';

type SessionActionData = {
	action: InputAction.Session;
	params: SessionParams;
};

/**
 * Handles session action - signs in and returns session data to callback
 */
export const handleSessionAction = async (
	data: SessionActionData,
	context: ActionContext
): Promise<Result<string>> => {
	const { pubky, dispatch } = context;
	const { callback } = data.params;

	// Session requires a pubky
	if (!pubky) {
		showToast({
			type: 'error',
			title: i18n.t('pubky.noSelection'),
			description: i18n.t('pubky.selectToProcess'),
		});
		return err('No pubky provided for session');
	}

	// Validate callback URL
	if (!callback?.includes('://')) {
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('session.invalidCallback'),
		});
		return err('Invalid callback URL');
	}

	try {
		// Sign in to homeserver
		const signInResult = await signInToHomeserver({
			pubky,
			dispatch,
		});

		if (signInResult.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('session.signInFailed'),
				description: signInResult.error.message,
			});
			return err(signInResult.error.message);
		}

		const sessionInfo = signInResult.value;

		// Build callback URL with session data
		const callbackUrl = buildCallbackUrl(callback, {
			pubky: sessionInfo.pubky,
			session_secret: sessionInfo.session_secret,
			capabilities: sessionInfo.capabilities.join(','),
		});

		// Open the callback URL to return data to external app
		const canOpen = await Linking.canOpenURL(callbackUrl);
		if (!canOpen) {
			showToast({
				type: 'error',
				title: i18n.t('common.error'),
				description: i18n.t('session.cannotOpenCallback'),
			});
			return err('Cannot open callback URL');
		}

		await Linking.openURL(callbackUrl);

		showToast({
			type: 'success',
			title: i18n.t('session.success'),
			description: i18n.t('session.sessionReturned'),
		});

		return ok(pubky);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		console.error('[SessionAction] Error:', errorMessage);
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: errorMessage,
		});
		return err(errorMessage);
	}
};

/**
 * Builds the callback URL with session data as query parameters
 */
const buildCallbackUrl = (
	baseCallback: string,
	params: {
		pubky: string;
		session_secret: string;
		capabilities: string;
	}
): string => {
	const separator = baseCallback.includes('?') ? '&' : '?';
	const queryParams = new URLSearchParams({
		pubky: params.pubky,
		session_secret: params.session_secret,
		capabilities: params.capabilities,
	}).toString();

	return `${baseCallback}${separator}${queryParams}`;
};
