import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Trans, useTranslation } from 'react-i18next';
import Button from '../components/Button.tsx';
import { EBackupPreference } from '../types/pubky.ts';
import { createBackupDestinationParams } from '../utils/sheetHelpers.ts';
import { truncateStr } from '../utils/pubky.ts';
import { BodyMBText, BodyMText, DisplayText } from '../theme/typography';
import { SheetScreen } from '../components/Sheet.tsx';
import type { BackupStackParamList } from '../sheets/types.ts';

const BackupPreferenceScreen = ({
	navigation,
	route,
}: NativeStackScreenProps<BackupStackParamList, 'BackupPreferenceScreen'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky } = route.params;
	const truncatedPubky = truncateStr(pubky).replace(/^pk:/, '');

	const chooseBackupPreference = async (
		backupPreference: EBackupPreference.encryptedFile | EBackupPreference.recoveryPhrase,
	): Promise<void> => {
		const params = await createBackupDestinationParams({ pubky, backupPreference });

		if (!params) {
			return;
		}

		switch (params.screen) {
			case 'BackupFileScreen':
				navigation.navigate('BackupFileScreen', params.params);
				return;
			case 'RecoveryPhraseScreen':
				navigation.navigate('RecoveryPhraseScreen', params.params);
				return;
		}
	};

	const onEncryptedFilePress = async (): Promise<void> => {
		await chooseBackupPreference(EBackupPreference.encryptedFile);
	};

	const onRecoveryPhrasePress = async (): Promise<void> => {
		await chooseBackupPreference(EBackupPreference.recoveryPhrase);
	};

	return (
		<SheetScreen id="backup" gradientType="brand" title={t('selectBackup.title')}>
			<DisplayText style={styles.headerText}>{t('selectBackup.header')}</DisplayText>

			<Trans
				t={t}
				i18nKey="selectBackup.message"
				parent={BodyMText}
				components={{ accent: <BodyMBText colorName="textPrimary" /> }}
				values={{ pubky: truncatedPubky }}
			/>

			<View style={styles.imageContainer}>
				<Image source={require('../images/shield.png')} style={styles.image} />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					text={t('backup.encryptedFile')}
					size="large"
					testID="BackupEncryptedFileButton"
					onPress={onEncryptedFilePress}
				/>
				<Button
					text={t('backup.recoveryPhrase')}
					size="large"
					variant="secondary"
					testID="BackupRecoveryPhraseButton"
					onPress={onRecoveryPhrasePress}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	headerText: {
		marginBottom: 20,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	image: {
		width: 279,
		height: 279,
		alignSelf: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
});

export default memo(BackupPreferenceScreen);
