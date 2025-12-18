/**
 * Input Handler Utilities
 *
 * Shared utilities for input handling hooks.
 * These functions handle common operations like routing, pubky selection, and error handling.
 */

import { Dispatch } from 'redux';
import { SheetManager } from 'react-native-actions-sheet';
import { ParsedInput, InputSource } from '../utils/inputParser';
import { routeInput, actionRequiresPubky, ActionContext } from '../utils/inputRouter';
import { setDeepLink } from '../store/slices/pubkysSlice';
import { copyToClipboard } from '../utils/clipboard';
import { showToast, sleep } from '../utils/helpers';
import { getErrorMessage } from '../utils/errorHandler';
import i18n from '../i18n';

export interface PubkyCallbacks {
	createPubky?: () => Promise<void>;
	importPubky?: (mnemonic?: string) => Promise<any>;
}

/**
 * Routes parsed input to the appropriate handler with context
 */
export const routeInputWithContext = async (
	parsed: ParsedInput,
	effectivePubky: string | undefined,
	source: InputSource,
	dispatch: Dispatch
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
		const errorMessage = getErrorMessage(result.error, i18n.t('errors.unknownError'));

		// Build debug info for troubleshooting
		const debugInfo = JSON.stringify({
			action: parsed.action,
			rawInput: parsed.rawInput,
			error: errorMessage,
		}, null, 2);

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

/**
 * Shows pubky selection sheet for multi-pubky scenarios
 */
export const showPubkySelectionSheet = async (
	parsed: ParsedInput,
	source: InputSource,
	dispatch: Dispatch,
	onSelect: (pubky: string) => Promise<void>
): Promise<void> => {
	await SheetManager.hideAll();
	await sleep(150);

	SheetManager.show('select-pubky', {
		payload: {
			deepLink: parsed.rawInput,
			onSelect: async (selectedPubky: string) => {
				SheetManager.hide('select-pubky');
				await onSelect(selectedPubky);
			},
		},
		onClose: (): void => {
			SheetManager.hide('select-pubky');
			if (source === 'deeplink') {
				dispatch(setDeepLink(''));
			}
		},
	});
};

/**
 * Handles the case when no pubkys are available for an action that requires one
 */
export const handleNoPubkysAvailable = (
	allPubkys: Record<string, unknown>,
	callbacks?: PubkyCallbacks
): void => {
	if (Object.keys(allPubkys).length > 0) {
		// Has pubkys but none are set up
		showToast({
			type: 'info',
			title: i18n.t('pubky.noPubkysSetup'),
			description: i18n.t('pubky.setupExistingToProcess'),
			visibilityTime: 5000,
		});
	} else {
		// No pubkys at all - show add-pubky sheet if callbacks provided
		showToast({
			type: 'info',
			title: i18n.t('pubky.noPubkysExist'),
			description: i18n.t('pubky.addAndSetupToProcess'),
			visibilityTime: 5000,
			onPress: callbacks?.createPubky && callbacks?.importPubky ? (): void => {
				SheetManager.show('add-pubky', {
					payload: {
						createPubky: callbacks.createPubky,
						importPubky: callbacks.importPubky,
					},
					onClose: (): void => {
						SheetManager.hide('add-pubky');
					},
				});
			} : undefined,
		});
	}
};

/**
 * Determines if a parsed input requires pubky selection and handles appropriately
 * Returns the selected pubky if one is auto-selected, or null if user selection is needed
 */
export const resolvePubkyForAction = async (
	parsed: ParsedInput,
	source: InputSource,
	signedUpPubkys: Record<string, unknown>,
	allPubkys: Record<string, unknown>,
	dispatch: Dispatch,
	callbacks?: PubkyCallbacks
): Promise<{ pubky: string | null; handled: boolean }> => {
	if (!actionRequiresPubky(parsed.action)) {
		return { pubky: null, handled: false };
	}

	const signedUpPubkyKeys = Object.keys(signedUpPubkys);

	if (signedUpPubkyKeys.length === 0) {
		handleNoPubkysAvailable(allPubkys, callbacks);
		if (source === 'deeplink') {
			dispatch(setDeepLink(''));
		}
		return { pubky: null, handled: true };
	}

	if (signedUpPubkyKeys.length === 1) {
		// Auto-select the only signed up pubky
		return { pubky: signedUpPubkyKeys[0], handled: false };
	}

	// Multiple pubkys - need user selection (caller handles this)
	return { pubky: null, handled: false };
};