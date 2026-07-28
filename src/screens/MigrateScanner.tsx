import React, { memo, ReactElement, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { SheetScreen } from '../components/Sheet.tsx';
import QRScannerContent from '../components/QRScannerContent.tsx';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { readFromClipboard } from '../utils/clipboard.ts';
import { checkNetworkConnection, showToast } from '../utils/helpers.ts';
import { InputAction, parseInput } from '../utils/inputParser.ts';
import { actionRequiresNetwork, routeInput } from '../utils/inputRouter.ts';
import {
	handleMigrationScannerClose,
	resetMigrateAccumulator,
	setOnMigrationComplete,
} from '../utils/actions/migrateAction.ts';
import { getIsOnline } from '../utils/store-helpers.ts';
import i18n from '../i18n';

const SHEET_ID = 'migrate';

const MigrateScanner = (): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const title = t('settings.migrateKeys');

	useEffect(() => {
		resetMigrateAccumulator();

		return (): void => {
			handleMigrationScannerClose();
			setOnMigrationComplete(null);
		};
	}, []);

	const handleInput = useCallback(
		async (data: string, source: 'scan' | 'clipboard'): Promise<void> => {
			const parsed = await parseInput(data, source);

			if (parsed.action !== InputAction.Migrate) {
				hideSheet(SHEET_ID);
				showToast({
					type: 'error',
					title: t('import.invalidData'),
					description: t('import.invalidClipboardData'),
				});
				return;
			}

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

			await routeInput(parsed, { dispatch });
		},
		[dispatch, t],
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

export default memo(MigrateScanner);
