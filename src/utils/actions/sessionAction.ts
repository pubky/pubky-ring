/**
 * Session Action Handler
 *
 * Handles session requests from external apps (e.g., Bitkit).
 * Signs in to the homeserver and returns session data via x-callback-url.
 *
 * Flow:
 * 1. External app sends: pubkyring://session?x-success=bitkit://session-data
 *    (or legacy: pubkyring://session?callback=bitkit://session-data)
 * 2. Ring prompts user to select a pubky when needed
 * 3. Ring prompts the user to approve handing a homeserver session to the callback app
 * 4. Ring opens x-success URL with session data: bitkit://session-data?pubky=...&session_secret=...
 */

import { Result, ok, err } from '@synonymdev/result';
import { showToast } from '@synonymdev/react-native-toast';
import { InputAction, SessionParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { signInToHomeserver } from '../pubky';
import { getErrorMessage } from '../errorHandler';
import { hasValidSessionCallbacks, openXSuccessWithParams, openXError } from '../xCallback';
import i18n from '../../i18n';
import { showSheet } from '../../sheets/sheetNavigation';

export type SessionActionData = {
	action: InputAction.Session;
	params: SessionParams;
};

/**
 * Handles session action - validates the callback and asks for explicit consent.
 */
export const handleSessionAction = async (
	data: SessionActionData,
	context: ActionContext,
): Promise<Result<string>> => {
	const { pubky } = context;
	const { xCallback } = data.params;

	// Session requires a pubky
	if (!pubky) {
		showToast({
			type: 'error',
			title: i18n.t('pubky.noSelection'),
			description: i18n.t('pubky.selectToProcess'),
		});
		return err('No pubky provided for session');
	}

	if (!hasValidSessionCallbacks(xCallback)) {
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('session.invalidCallback'),
		});
		return err('Invalid callback URL');
	}

	showSheet('auth', {
		screen: 'ConfirmSession',
		params: {
			pubky,
			xCallback,
		},
	});

	return ok(pubky);
};

/**
 * Executes an approved session request and returns session data via x-callback-url.
 */
export const executeSessionAction = async (
	data: SessionActionData,
	context: ActionContext,
): Promise<Result<string>> => {
	const { pubky, dispatch } = context;
	const { xCallback } = data.params;

	if (!pubky) {
		return err('No pubky provided for session');
	}

	if (!hasValidSessionCallbacks(xCallback)) {
		return err('Invalid callback URL');
	}

	try {
		// Sign in to homeserver
		const signInResult = await signInToHomeserver({
			pubky,
			dispatch,
		});

		if (signInResult.isErr()) {
			const errorMessage = getErrorMessage(signInResult.error, i18n.t('errors.signInFailed'));
			showToast({
				type: 'error',
				title: i18n.t('session.signInFailed'),
				description: errorMessage,
			});
			await openXError(xCallback, 'SESSION_FAILED', errorMessage);
			return err(errorMessage);
		}

		const sessionInfo = signInResult.value;

		// Open x-success URL with session data appended as query params
		await openXSuccessWithParams(xCallback, {
			pubky: sessionInfo.pubky,
			session_secret: sessionInfo.session_secret,
			capabilities: sessionInfo.capabilities.join(','),
		});

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
		await openXError(xCallback, 'SESSION_ERROR', errorMessage);
		return err(errorMessage);
	}
};
