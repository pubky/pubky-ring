import React, { memo, ReactElement, useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import QRScannerContent from '../components/QRScannerContent.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { AuthStackParamList } from '../sheets/types.ts';
import { readFromClipboard } from '../utils/clipboard.ts';
import { getErrorMessage } from '../utils/errorHandler.ts';
import { checkNetworkConnection } from '../utils/helpers.ts';
import { InputAction, parseInput } from '../utils/inputParser.ts';
import { actionRequiresNetwork, routeInput } from '../utils/inputRouter.ts';
import { getAutoAuthFromStore, getIsOnline } from '../utils/store-helpers.ts';
import { createConfirmAuthPayload } from '../utils/actions/authAction.ts';

const SHEET_ID = 'auth';

const AuthScanner = ({
	route,
	navigation,
}: NativeStackScreenProps<AuthStackParamList, 'Scanner'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { pubky } = route.params;
	const title = t('auth.authorize');

	const showRouteError = useCallback((action: InputAction, error: unknown): void => {
		const errorMsg = getErrorMessage(error, t('errors.unknownError'));
		const debugInfo = JSON.stringify({ error: errorMsg, action }, null, 2);

		console.error('Auth scanner route error:', debugInfo);

		showToast({
			type: 'error',
			title: t('common.error'),
			description: errorMsg,
		});
	}, [t]);

	const handleInput = useCallback(
		async (input: string, source: 'scan' | 'clipboard'): Promise<void> => {
			const parsed = await parseInput(input, source);

			if (actionRequiresNetwork(parsed.action) && !getIsOnline()) {
				const connected = await checkNetworkConnection({
					prevNetworkState: false,
					dispatch,
					displayToastIfOnline: false,
					displayToastIfOffline: false,
				});

				if (!connected) {
					showToast({
						type: 'error',
						title: t('network.currentlyOffline'),
						description: t('network.offlineDescription'),
						autoHide: false,
					});
					return;
				}
			}

			if (parsed.action === InputAction.Auth && parsed.data.action === InputAction.Auth) {
				if (getAutoAuthFromStore()) {
					hideSheet(SHEET_ID);
					const result = await routeInput(parsed, { dispatch, pubky });

					if (result.isErr()) {
						showRouteError(parsed.action, result.error);
					}
					return;
				}

				const confirmAuthPayload = await createConfirmAuthPayload({
					data: parsed.data,
					pubky,
				});

				if (confirmAuthPayload.isErr()) {
					showToast({
						type: 'error',
						title: t('common.error'),
						description: confirmAuthPayload.error.message,
					});
					return;
				}

				navigation.navigate('ConfirmAuth', confirmAuthPayload.value);
				return;
			}

			hideSheet(SHEET_ID);
			const result = await routeInput(parsed, { dispatch, pubky });

			if (result.isErr()) {
				showRouteError(parsed.action, result.error);
			}
		},
		[dispatch, navigation, pubky, showRouteError, t],
	);

	const onCopyClipboard = useCallback(async (): Promise<void> => {
		const clipboardContents = await readFromClipboard();
		if (!clipboardContents) {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('errors.emptyClipboard'),
			});
			return;
		}

		await handleInput(clipboardContents, 'clipboard');
	}, [handleInput, t]);

	return (
		<SheetScreen id={SHEET_ID} title={title}>
			<QRScannerContent onScan={data => handleInput(data, 'scan')} onCopyClipboard={onCopyClipboard} />
		</SheetScreen>
	);
};

export default memo(AuthScanner);
