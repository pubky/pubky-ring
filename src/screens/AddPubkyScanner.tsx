import React, { memo, ReactElement, useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { SheetScreen } from '../components/Sheet.tsx';
import QRScannerContent from '../components/QRScannerContent.tsx';
import { readFromClipboard } from '../utils/clipboard';
import { showToast } from '../utils/helpers.ts';
import { parseInput, InputAction } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import type { AddPubkySheetScreenParams, AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';

const AddPubkyScanner = ({
	navigation,
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'Scanner'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { mode } = route.params;
	const title = mode === 'import' ? t('import.title') : t('home.scanQR');

	const replaceRoute = useCallback(
		(nextRoute: AddPubkySheetScreenParams): void => {
			navigation.dispatch(StackActions.replace(nextRoute.screen, nextRoute.params));
		},
		[navigation],
	);

	const isAllowedAction = useCallback(
		(action: InputAction): boolean => {
			if (mode === 'signup') {
				return action === InputAction.Signup || action === InputAction.Invite;
			}

			return action === InputAction.Import;
		},
		[mode],
	);

	const showInvalidInputToast = useCallback((): void => {
		if (mode === 'signup') {
			showToast({
				type: 'error',
				title: t('scanInvite.invalidInviteCode'),
				description: t('scanInvite.invalidInviteDescription'),
			});
			return;
		}

		showToast({
			type: 'error',
			title: t('import.invalidData'),
			description: t('import.invalidClipboardData'),
		});
	}, [mode, t]);

	const handleScannedInput = useCallback(
		async (data: string, source: 'scan' | 'clipboard') => {
			const parsed = await parseInput(data, source);

			if (!isAllowedAction(parsed.action)) {
				showInvalidInputToast();
				return;
			}

			const result = await routeInput(parsed, {
				dispatch,
				setAddPubkyScreen: replaceRoute,
			});

			if (result.isErr()) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: result.error.message,
				});
			}
		},
		[dispatch, isAllowedAction, replaceRoute, showInvalidInputToast, t],
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

		await handleScannedInput(clipboardContents, 'clipboard');
	}, [handleScannedInput, t]);

	return (
		<SheetScreen id={SHEET_ID} title={title}>
			<QRScannerContent onScan={data => handleScannedInput(data, 'scan')} onCopyClipboard={onCopyClipboard} />
		</SheetScreen>
	);
};

export default memo(AddPubkyScanner);
