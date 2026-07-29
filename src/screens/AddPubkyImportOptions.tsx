import React, { memo, ReactElement, useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { FileText, Lock, Scan } from '../icons/index.ts';
import { BodyMText, DisplayText } from '../theme/typography';
import { importFile } from '../utils/rnfs.ts';
import { showToast } from '../utils/helpers.ts';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';

const AddPubkyImportOptions = ({
	navigation,
}: NativeStackScreenProps<AddPubkyStackParamList, 'ImportOptions'>): ReactElement => {
	const { t } = useTranslation();

	const onUploadFile = useCallback(async (): Promise<void> => {
		const result = await importFile();

		if (result.isErr() && result.error.message !== 'OPERATION_CANCELED') {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: result.error.message,
			});
			return;
		}

		if (result.isOk()) {
			navigation.navigate('ImportFileScreen', result.value);
		}
	}, [navigation, t]);

	return (
		<SheetScreen id={SHEET_ID} title={t('import.title')} gradientType="brand">
			<DisplayText style={styles.headerText}>{t('addPubky.restoreOrImport')}</DisplayText>
			<BodyMText>{t('addPubky.chooseBackupMethod')}</BodyMText>
			<View style={styles.imageContainer}>
				<Image source={require('../images/import-pubky.png')} style={styles.importImage} />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					text={t('addPubky.encryptedFile')}
					size="medium"
					icon={<Lock />}
					testID="EncryptedFileButton"
					onPress={onUploadFile}
				/>
				<Button
					text={t('addPubky.recoveryPhrase')}
					size="medium"
					icon={<FileText />}
					testID="RecoveryPhraseButton"
					onPress={() => navigation.navigate('ImportMnemonic')}
				/>
				<Button
					text={t('addPubky.scanQrToImport')}
					size="medium"
					icon={<Scan />}
					testID="ScanQrButton"
					onPress={() => navigation.navigate('Scanner', { mode: 'import' })}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	headerText: {
		marginBottom: 20,
	},
	importImage: {
		width: 200,
		height: 200,
		alignSelf: 'center',
	},
	buttonContainer: {
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(AddPubkyImportOptions);
