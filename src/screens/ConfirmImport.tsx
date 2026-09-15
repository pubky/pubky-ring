import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PermissionCard from '../components/PermissionCard.tsx';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { TextBaseM, TextSmM, TextXsM } from '../theme/typography.ts';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { AddPubkySheetScreenParams, AddPubkyStackParamList } from '../sheets/types.ts';
import { InputAction } from '../utils/inputParser';
import { executeImportAction } from '../utils/actions/importAction.ts';
import { EBackupPreference } from '../types/pubky';

const SHEET_ID = 'add-pubky';

const ConfirmImport = ({
	navigation,
	route,
}: NativeStackScreenProps<AddPubkyStackParamList, 'ConfirmImport'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { data, backupPreference } = route.params;
	const [isApproving, setIsApproving] = useState(false);

	const materialLabel = useMemo(() => {
		if (backupPreference === EBackupPreference.recoveryPhrase) {
			return t('import.materialRecoveryPhrase');
		}
		return t('import.materialSecretKey');
	}, [backupPreference, t]);

	const closeSheet = useCallback(() => {
		hideSheet(SHEET_ID);
	}, []);

	const handleDeny = useCallback(() => {
		closeSheet();
	}, [closeSheet]);

	const setAddPubkyScreen = useCallback(
		(screenParams: AddPubkySheetScreenParams): void => {
			navigation.navigate(screenParams.screen, screenParams.params as never);
		},
		[navigation],
	);

	const handleAllow = useCallback(async () => {
		setIsApproving(true);
		const result = await executeImportAction(
			{
				action: InputAction.Import,
				params: { data, backupPreference },
			},
			{ dispatch, setAddPubkyScreen },
		);
		setIsApproving(false);

		if (result.isErr()) {
			return;
		}
	}, [backupPreference, data, dispatch, setAddPubkyScreen]);

	return (
		<SheetScreen id={SHEET_ID} title={t('import.confirmTitle')} titleTestID="confirm-import-title">
			<PermissionCard style={styles.detailsCard}>
				<TextXsM style={styles.sectionTitle}>{t('import.confirmMaterial')}</TextXsM>
				<TextBaseM>{materialLabel}</TextBaseM>
			</PermissionCard>

			<TextSmM style={styles.warningText} colorName="mutedForeground">
				{t('import.confirmWarning')}
			</TextSmM>

			<View style={styles.spacer} />

			<View style={styles.buttonContainer}>
				<Button
					text={t('common.cancel')}
					size="large"
					testID="ConfirmImportCancelButton"
					disabled={isApproving}
					onPress={handleDeny}
				/>
				<Button
					text={isApproving ? t('import.approving') : t('import.allow')}
					size="large"
					variant="secondary"
					testID="ConfirmImportAllowButton"
					loading={isApproving}
					onPress={handleAllow}
				/>
			</View>

			<SafeAreaInset edge="bottom" />
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	detailsCard: {
		marginBottom: 16,
	},
	sectionTitle: {
		marginBottom: 8,
	},
	warningText: {
		marginTop: 8,
	},
	spacer: {
		flex: 1,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
});

export default memo(ConfirmImport);
