/**
 * useInputHandler Hook
 *
 * Handles QR scans, clipboard, and direct input processing.
 * For deeplink handling, use useDeepLinkHandler instead.
 */

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SheetManager } from 'react-native-actions-sheet';
import { parseInput, InputSource, InputAction } from '../utils/inputParser';
import { actionRequiresPubky, actionRequiresNetwork, shouldCloseCameraBeforeRouting } from '../utils/inputRouter';
import { getSignedUpPubkys, getAllPubkys } from '../store/selectors/pubkySelectors';
import { readFromClipboard } from '../utils/clipboard';
import { showToast, checkNetworkConnection } from '../utils/helpers';
import { getIsOnline } from '../utils/store-helpers';
import i18n from '../i18n';
import {
	routeInputWithContext,
	showPubkySelectionSheet,
	handleNoPubkysAvailable,
} from './inputHandlerUtils';
import { handleMigrationScannerClose, resetMigrateAccumulator } from '../utils/actions/migrateAction';

interface UseInputHandlerOptions {
	// The currently selected pubky (for auth actions)
	pubky?: string;
	// Callback when input processing completes
	onComplete?: () => void;
}

interface UseInputHandlerReturn {
	// Process raw input from any source
	handleInput: (data: string, source: InputSource, overridePubky?: string) => Promise<void>;
	// Process clipboard content
	handleClipboard: () => Promise<void>;
	// Show QR scanner and process result
	showScanner: (options?: ScannerOptions) => Promise<void>;
}

interface ScannerOptions {
	title?: string;
	// Pubky to use for auth (overrides hook's pubky)
	pubky?: string;
	// Restrict scanner to only accept certain action types
	allowedActions?: InputAction[];
	// Custom error message when action is not allowed
	disallowedActionError?: {
		title: string;
		description: string;
	};
}

/**
 * Hook for handling QR scans, clipboard, and direct input
 */
export const useInputHandler = (options: UseInputHandlerOptions = {}): UseInputHandlerReturn => {
	const { pubky, onComplete } = options;
	const dispatch = useDispatch();
	const signedUpPubkys = useSelector(getSignedUpPubkys);
	const allPubkys = useSelector(getAllPubkys);
	const isProcessing = useRef(false);

	/**
	 * Main input handler - processes any input from scan/clipboard sources
	 */
	const handleInput = useCallback(async (
		data: string,
		source: InputSource,
		overridePubky?: string
	): Promise<void> => {
		if (!data || isProcessing.current) return;

		isProcessing.current = true;

		try {
			// Parse the input
			const parsed = await parseInput(data, source);

			// Check if action requires network
			if (actionRequiresNetwork(parsed.action)) {
				const isOnline = getIsOnline();
				if (!isOnline) {
					const connected = await checkNetworkConnection({
						prevNetworkState: isOnline,
						dispatch,
						displayToastIfOnline: false,
						displayToastIfOffline: true,
					});
					if (!connected) {
						showToast({
							type: 'error',
							title: i18n.t('network.currentlyOffline'),
							description: i18n.t('network.offlineDescription'),
							autoHide: false,
						});
						return;
					}
				}
			}

			// Check if action requires pubky selection
			const effectivePubky = overridePubky || pubky;
			if (actionRequiresPubky(parsed.action) && !effectivePubky) {
				const signedUpPubkyKeys = Object.keys(signedUpPubkys);

				if (signedUpPubkyKeys.length === 0) {
					handleNoPubkysAvailable(allPubkys);
					return;
				}

				if (signedUpPubkyKeys.length === 1) {
					// Auto-select the only signed up pubky
					await routeInputWithContext(parsed, signedUpPubkyKeys[0], source, dispatch);
					return;
				}

				// Multiple pubkys - show selection sheet
				const selectedPubky = await showPubkySelectionSheet(
					parsed,
					source,
					dispatch,
				);
				if (selectedPubky) {
					await routeInputWithContext(parsed, selectedPubky, source, dispatch);
				}
				return;
			}

			// Route the input to the appropriate handler
			await routeInputWithContext(parsed, effectivePubky, source, dispatch);
		} catch (error) {
			console.error('Error handling input:', error);
			showToast({
				type: 'error',
				title: i18n.t('common.error'),
				description: i18n.t('errors.failedToProcessInput'),
			});
		} finally {
			isProcessing.current = false;
			onComplete?.();
		}
	}, [pubky, signedUpPubkys, allPubkys, dispatch, onComplete]);

	/**
	 * Handle clipboard content
	 */
	const handleClipboard = useCallback(async (): Promise<void> => {
		const clipboardContent = await readFromClipboard();
		if (!clipboardContent) {
			showToast({
				type: 'error',
				title: i18n.t('common.error'),
				description: i18n.t('errors.emptyClipboard'),
			});
			return;
		}
		await handleInput(clipboardContent, 'clipboard');
	}, [handleInput]);

	/**
	 * Show QR scanner and handle result
	 */
	const showScanner = useCallback(async (scannerOptions?: ScannerOptions): Promise<void> => {
		const { title, pubky: scannerPubky, allowedActions, disallowedActionError } = scannerOptions || {};

		// Reset any stale migration state before opening scanner
		resetMigrateAccumulator();

		// Check network before showing scanner
		const isOnline = getIsOnline();
		if (!isOnline) {
			const connected = await checkNetworkConnection({
				prevNetworkState: isOnline,
				dispatch,
				displayToastIfOnline: false,
				displayToastIfOffline: false,
			});
			if (!connected) {
				showToast({
					type: 'error',
					title: i18n.t('network.currentlyOffline'),
					description: i18n.t('network.offlineDescription'),
					autoHide: false,
				});
				return;
			}
		}

		// Helper to check if action is allowed
		const isActionAllowed = (action: InputAction): boolean => {
			if (!allowedActions || allowedActions.length === 0) {
				return true; // No filter, all actions allowed
			}
			return allowedActions.includes(action);
		};

		// Helper to show disallowed action error
		const showDisallowedError = async (): Promise<void> => {
			await SheetManager.hide('camera');
			showToast({
				type: 'error',
				title: disallowedActionError?.title ?? i18n.t('import.invalidData'),
				description: disallowedActionError?.description ?? i18n.t('import.invalidClipboardData'),
			});
		};

		return new Promise<void>((resolve) => {
			SheetManager.show('camera', {
				payload: {
					title,
					onScan: async (data: string) => {
						// Parse to determine if camera should stay open
						const parsed = await parseInput(data, 'scan');

						// Check if action is allowed when filter is set
						if (!isActionAllowed(parsed.action)) {
							await showDisallowedError();
							resolve();
							return;
						}

						if (shouldCloseCameraBeforeRouting(parsed.action)) {
							await SheetManager.hide('camera');
							await handleInput(data, 'scan', scannerPubky);
							resolve();
						} else {
							// Action handles camera closing (e.g., migrate accumulates frames)
							await handleInput(data, 'scan', scannerPubky);
						}
					},
					onCopyClipboard: async (): Promise<void> => {
						await SheetManager.hide('camera');
						const clipboardContent = await readFromClipboard();
						if (clipboardContent) {
							// Check if action is allowed when filter is set
							const parsed = await parseInput(clipboardContent, 'clipboard');
							if (!isActionAllowed(parsed.action)) {
								showToast({
									type: 'error',
									title: disallowedActionError?.title ?? i18n.t('import.invalidData'),
									description: disallowedActionError?.description ?? i18n.t('import.invalidClipboardData'),
								});
								resolve();
								return;
							}
							await handleInput(clipboardContent, 'clipboard', scannerPubky);
						}
						resolve();
					},
					onClose: () => {
						// Handle any partial migration (shows summary if keys were imported, then resets)
						handleMigrationScannerClose();
						SheetManager.hide('camera');
						resolve();
					},
				},
			});
		});
	}, [handleInput, dispatch]);

	return {
		handleInput,
		handleClipboard,
		showScanner,
	};
};

/**
 * Simplified hook for components that just need to trigger a scan
 */
export const useQRScan = (pubky?: string): { scan: () => Promise<void>; paste: () => Promise<void> } => {
	const { showScanner, handleClipboard } = useInputHandler({ pubky });

	return {
		scan: (): Promise<void> => showScanner({ pubky }),
		paste: handleClipboard,
	};
};
