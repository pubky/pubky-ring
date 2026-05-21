import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { EBackupPreference } from '../types/pubky.ts';
import { showBackupPrompt } from '../utils/sheetHelpers.ts';
import { truncateStr } from '../utils/pubky.ts';
import { BodyMText, DisplayText } from '../theme/typography';
import Sheet from './Sheet.tsx';
import { useTranslation } from 'react-i18next';

const BACKUP_PROMPT_DELAY = 250;

const SelectBackupPreference = ({ payload: { pubky } }: { payload: { pubky: string } }): ReactElement => {
	const { t } = useTranslation();
	const truncatedPubky = truncateStr(pubky).replace(/^pk:/, '');
	const messageText = t('selectBackup.message', { pubky: truncatedPubky });

	const selectPreference = (backupPreference: EBackupPreference): void => {
		void SheetManager.hide('select-backup-preference');
		setTimeout(() => {
			void showBackupPrompt({ pubky, backupPreference });
		}, BACKUP_PROMPT_DELAY);
	};

	const onEncryptedFilePress = (): void => {
		selectPreference(EBackupPreference.encryptedFile);
	};

	const onRecoveryPhrasePress = (): void => {
		selectPreference(EBackupPreference.recoveryPhrase);
	};

	return (
		<Sheet id="select-backup-preference" gradientType="brand" title={t('selectBackup.title')}>
			<DisplayText style={styles.headerText}>{t('selectBackup.header')}</DisplayText>
			<BodyMText>{messageText}</BodyMText>
			<View style={styles.imageContainer}>
				<Image source={require('../images/shield.png')} style={styles.image} />
			</View>
			<View style={styles.buttonContainer}>
				<Button text={t('backup.encryptedFile')} size="large" onPress={onEncryptedFilePress} />
				<Button
					text={t('backup.recoveryPhrase')}
					size="large"
					variant="secondary"
					onPress={onRecoveryPhrasePress}
				/>
			</View>
		</Sheet>
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

export default memo(SelectBackupPreference);
