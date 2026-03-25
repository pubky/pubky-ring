/**
 * Session Action Handler
 *
 * Handles session requests from external apps (e.g., Bitkit).
 * Signs in to the homeserver and returns session data via x-callback-url.
 *
 * Flow:
 * 1. External app sends: pubkyring://session?x-success=bitkit://session-data
 *    (or legacy: pubkyring://session?callback=bitkit://session-data)
 * 2. Ring prompts user to select a pubky (handled by useInputHandler)
 * 3. Ring signs in to homeserver
 * 4. Ring opens x-success URL with session data: bitkit://session-data?pubky=...&session_secret=...
 */

import { Result, ok, err } from '@synonymdev/result';
import { InputAction, SessionParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { signInToHomeserver } from '../pubky';
import { showToast } from '../helpers';
import { getErrorMessage } from '../errorHandler';
import { openXSuccessWithParams, openXError } from '../xCallback';
import i18n from '../../i18n';

type SessionActionData = {
	action: InputAction.Session;
	params: SessionParams;
};

/**
 * Handles session action - signs in and returns session data via x-callback-url
 */
export const handleSessionAction = async (
	data: SessionActionData,
	context: ActionContext
): Promise<Result<string>> => {
	const { pubky, dispatch } = context;
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

	// Validate x-success URL
	if (!xCallback?.xSuccess?.includes('://')) {
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
