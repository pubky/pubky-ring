import React, { memo, ReactElement, useCallback } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import QRScannerContent from '../components/QRScannerContent.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { AuthStackParamList } from '../sheets/types.ts';
import { readFromClipboard, copyToClipboard } from '../utils/clipboard.ts';
import { getErrorMessage } from '../utils/errorHandler.ts';
import { checkNetworkConnection, showToast } from '../utils/helpers.ts';
import { InputAction, parseInput } from '../utils/inputParser.ts';
import { actionRequiresNetwork, routeInput } from '../utils/inputRouter.ts';
import { getAutoAuthFromStore, getIsOnline } from '../utils/store-helpers.ts';
import { createConfirmAuthPayload } from '../utils/actions/authAction.ts';
import i18n from '../i18n';

const SHEET_ID = 'auth';

const AuthScanner = ({
	route,
	navigation,
}: NativeStackScreenProps<AuthStackParamList, 'Scanner'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { pubky } = route.params;
	const title = t('auth.authorize');

	const showRouteError = useCallback((input: string, action: InputAction, error: unknown): void => {
		const errorMsg = getErrorMessage(error, i18n.t('errors.unknownError'));
		const debugInfo = JSON.stringify(
			{
				error: errorMsg,
				input: input.substring(0, 100),
				action,
			},
			null,
			2,
		);

		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: errorMsg,
			onPress: () => {
				copyToClipboard(debugInfo);
				showToast({
					type: 'success',
					title: i18n.t('common.copied'),
					description: i18n.t('errors.debugInfoCopied'),
				});
			},
		});
	}, []);

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
						title: i18n.t('network.currentlyOffline'),
						description: i18n.t('network.offlineDescription'),
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
						showRouteError(input, parsed.action, result.error);
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
				showRouteError(input, parsed.action, result.error);
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
