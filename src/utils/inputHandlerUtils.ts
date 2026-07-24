/**
 * Input Handler Utilities
 *
 * Shared utilities for input handling hooks.
 * These functions handle common operations like routing, pubky selection, and error handling.
 */

import { Dispatch } from 'redux';
import { showSheet } from '../sheets/sheetNavigation.tsx';
import { ParsedInput, InputSource, InputAction } from './inputParser';
import { routeInput, ActionContext } from './inputRouter';
import { setDeepLink } from '../store/slices/pubkysSlice';
import { copyToClipboard } from './clipboard';
import { showToast } from './helpers';
import { getErrorMessage } from './errorHandler';
import i18n from '../i18n';

/**
 * Routes parsed input to the appropriate handler with context
 */
export const routeInputWithContext = async (
	parsed: ParsedInput,
	effectivePubky: string | undefined,
	source: InputSource,
	dispatch: Dispatch,
): Promise<void> => {
	// Clear deeplink BEFORE processing to prevent re-triggering
	if (source === 'deeplink') {
		dispatch(setDeepLink(''));
	}

	const context: ActionContext = {
		dispatch,
		pubky: effectivePubky,
		isDeeplink: source === 'deeplink',
	};

	const result = await routeInput(parsed, context);

	if (result.isErr()) {
		// Skip toast for signup/invite actions - they handle errors via the loading modal
		if (parsed.action === InputAction.Signup || parsed.action === InputAction.Invite) {
			return;
		}

		const errorMessage = getErrorMessage(result.error, i18n.t('errors.unknownError'));

		// Build debug info for troubleshooting
		const debugInfo = JSON.stringify(
			{
				action: parsed.action,
				rawInput: parsed.rawInput,
				error: errorMessage,
			},
			null,
			2,
		);

		console.error('Input routing error:', debugInfo);

		const description = `${errorMessage} (${i18n.t('errors.tapToCopyDebug')})`;

		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description,
			autoHide: false,
			onPress: () => {
				copyToClipboard(debugInfo);
				showToast({
					type: 'success',
					title: i18n.t('common.copied'),
					description: i18n.t('errors.debugInfoCopied'),
				});
			},
		});
	}
};

export const showAuthPubkySelection = (parsed: ParsedInput, source: InputSource): void => {
	const selectPubky = {
		deepLink: parsed.rawInput,
		source,
	};

	showSheet('auth', {
		screen: 'SelectPubky',
		params: selectPubky,
	});
};

/**
 * Handles the case when no pubkys are available for an action that requires one
 */
export const handleNoPubkysAvailable = (allPubkys: Record<string, unknown>): void => {
	if (Object.keys(allPubkys).length > 0) {
		// Has pubkys but none are set up
		showToast({
			type: 'info',
			title: i18n.t('pubky.noPubkysSetup'),
			description: i18n.t('pubky.setupExistingToProcess'),
			visibilityTime: 5000,
		});
	} else {
		// No pubkys at all - prompt setup from the add-pubky sheet
		showToast({
			type: 'info',
			title: i18n.t('pubky.noPubkysExist'),
			description: i18n.t('pubky.addAndSetupToProcess'),
			visibilityTime: 5000,
			onPress: () => showSheet('add-pubky'),
		});
	}
};
