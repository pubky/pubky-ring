import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useTypedNavigation } from '../navigation/hooks';
import { Dispatch } from '@reduxjs/toolkit';
import { SheetManager } from 'react-native-actions-sheet';
import { parseInput } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import { readFromClipboard, copyToClipboard } from '../utils/clipboard';
import { showToast, checkNetworkConnection } from '../utils/helpers';
import { getIsOnline } from '../utils/store-helpers';
import i18n from '../i18n';

interface PubkyHandlersReturn {
    onPubkyPress: (pubky: string, index: number) => void;
    onQRPress: (data: { pubky: string; dispatch: Dispatch; onComplete?: () => void }) => Promise<string>;
}

export const usePubkyHandlers = (): PubkyHandlersReturn => {
	const navigation = useTypedNavigation();
	const dispatch = useDispatch();

	const onPubkyPress = useCallback(
		(pubky: string, index: number) => {
			navigation.navigate('PubkyDetail', { pubky, index });
		},
		[navigation],
	);

	const onQRPress = useCallback(async (data: {
        pubky: string;
        dispatch: Dispatch;
        onComplete?: () => void;
    }) => {
		const { pubky, onComplete } = data;

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
				return '';
			}
		}

		return new Promise<string>((resolve) => {
			SheetManager.show('camera', {
				payload: {
					onScan: async (scannedData: string) => {
						await SheetManager.hide('camera');
						const parsed = await parseInput(scannedData, 'scan');
						const result = await routeInput(parsed, { dispatch, pubky });
						if (result.isErr()) {
							const debugInfo = JSON.stringify({
								error: result.error.message,
								input: scannedData.substring(0, 100),
								action: parsed.action,
							}, null, 2);
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: result.error.message,
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
						onComplete?.();
						resolve(result.isOk() ? scannedData : result.error.message);
					},
					onCopyClipboard: async (): Promise<void> => {
						await SheetManager.hide('camera');
						const clipboardContents = await readFromClipboard();
						if (!clipboardContents) {
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: i18n.t('errors.emptyClipboard'),
							});
							resolve('');
							return;
						}
						const parsed = await parseInput(clipboardContents, 'clipboard');
						const result = await routeInput(parsed, { dispatch, pubky });
						if (result.isErr()) {
							const debugInfo = JSON.stringify({
								error: result.error.message,
								input: clipboardContents.substring(0, 100),
								action: parsed.action,
							}, null, 2);
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: result.error.message,
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
						onComplete?.();
						resolve(result.isOk() ? clipboardContents : result.error.message);
					},
					onClose: () => {
						SheetManager.hide('camera');
						resolve('');
					},
				},
			});
		});
	}, [dispatch]);

	return {
		onPubkyPress,
		onQRPress,
	};
};
