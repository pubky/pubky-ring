/**
 * Auth Action Handler
 *
 * Handles authentication requests from any input source.
 * This consolidates all auth URL processing logic.
 */

import { Result, ok, err } from '@synonymdev/result';
import { parseAuthUrl, PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import { SheetManager } from 'react-native-actions-sheet';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { InputAction, AuthParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { performAuth } from '../pubky';
import { showToast } from '../helpers';
import { getAutoAuthFromStore } from '../store-helpers';
import { AUTH_SHEET_DELAY } from '../constants';
import i18n from '../../i18n';

type AuthActionData = {
	action: InputAction.Auth;
	params: AuthParams;
	rawUrl: string;
};

/**
 * Handles auth action - either shows confirmation modal or auto-auths
 */
export const handleAuthAction = async (
	data: AuthActionData,
	context: ActionContext
): Promise<Result<string>> => {
	const { pubky, dispatch } = context;
	const { rawUrl } = data;

	// Auth requires a pubky
	if (!pubky) {
		showToast({
			type: 'error',
			title: i18n.t('pubky.noSelection'),
			description: i18n.t('pubky.selectToProcess'),
		});
		return err('No pubky provided for authentication');
	}

	// Parse the auth URL to validate it
	const authResult = await parseAuthUrl(rawUrl);
	if (authResult.isErr()) {
		const description = authResult.error?.message ?? i18n.t('errors.failedToParseAuth');
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description,
		});
		return err(description);
	}

	// Check if auto-auth is enabled
	const autoAuth = getAutoAuthFromStore();

	if (autoAuth) {
		// Auto-auth flow - no confirmation modal
		return handleAutoAuth({
			pubky,
			authUrl: rawUrl,
			dispatch,
		});
	}

	// Manual auth flow - show confirmation modal
	return showAuthConfirmation({
		pubky,
		authUrl: rawUrl,
		authDetails: authResult.value,
	});
};

/**
 * Handles auto-auth flow without user confirmation
 */
const handleAutoAuth = async ({
	pubky,
	authUrl,
	dispatch,
}: {
	pubky: string;
	authUrl: string;
	dispatch: ActionContext['dispatch'];
}): Promise<Result<string>> => {
	const res = await performAuth({
		pubky,
		authUrl,
		dispatch,
	});

	if (res.isOk()) {
		showToast({
			type: 'success',
			title: i18n.t('common.success'),
			description: i18n.t('auth.authorized', { pubky }),
		});
	} else {
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: res.error.message,
		});
	}

	return res;
};

/**
 * Shows the auth confirmation modal
 */
const showAuthConfirmation = async ({
	pubky,
	authUrl,
	authDetails,
}: {
	pubky: string;
	authUrl: string;
	authDetails: PubkyAuthDetails;
}): Promise<Result<string>> => {
	try {
		SystemNavigationBar.navigationHide().then();

		// Small timeout allows the sheet time to properly display
		setTimeout(() => {
			SheetManager.show('confirm-auth', {
				payload: {
					pubky,
					authUrl,
					authDetails,
					onComplete: async (): Promise<void> => {},
				},
				onClose: () => {
					SystemNavigationBar.navigationShow().then();
					SheetManager.hide('confirm-auth');
				},
			});
		}, AUTH_SHEET_DELAY);

		return ok('success');
	} catch (error) {
		const description = i18n.t('errors.failedToParseAuth');
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description,
		});
		console.log(`${description}:`, error);
		SystemNavigationBar.navigationShow().then();
		return err(description);
	}
};
