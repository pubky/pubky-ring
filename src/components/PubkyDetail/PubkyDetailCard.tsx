import React, { memo, useCallback, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PubkyData } from '../../navigation/types.ts';
import Button from '../Button.tsx';
import { shareData } from '../../utils/helpers.ts';
import { showEditPubkySheet } from '../../utils/sheetHelpers.ts';
import PubkyProfile from '../PubkyProfile.tsx';
import { Scan, Share, Shield, Trash } from '../../icons/index.ts';

interface PubkyDetailCardProps {
	index: number;
	pubky: string;
	pubkyData: PubkyData;
	onQRPress: () => Promise<void>;
	onDelete: () => void;
	onBackup: () => void;
}

export const PubkyDetailCard = memo(
	({ index, pubky, pubkyData, onQRPress, onDelete, onBackup }: PubkyDetailCardProps) => {
		const { t } = useTranslation();
		const [fontScale] = useState(PixelRatio.getFontScale());
		const [isQRLoading, setIsQRLoading] = useState(false);

		const pubkyUri = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
		const onSharePress = useCallback(() => {
			shareData(pubkyUri).then();
		}, [pubkyUri]);

		const handleButtonPress = useCallback(async () => {
			if (!pubkyData.signedUp) {
				showEditPubkySheet({
					title: t('pubky.setup'),
					pubky,
					data: pubkyData,
				});
			} else {
				setIsQRLoading(true);
				try {
					await onQRPress();
				} finally {
					setIsQRLoading(false);
				}
			}
		}, [onQRPress, pubky, pubkyData, t]);

		const buttonIcon = pubkyData.signedUp ? <Scan /> : undefined;
		const buttonText = pubkyData.signedUp ? t('auth.authorize') : t('pubky.setup');

		const showActionIcons = fontScale <= 1;
		const shareIcon = showActionIcons ? <Share /> : undefined;
		const backupIcon = showActionIcons ? <Shield /> : undefined;
		const deleteIcon = showActionIcons ? <Trash /> : undefined;

		return (
			<View style={styles.container}>
				<PubkyProfile
					index={index}
					pubky={pubky}
					pubkyData={pubkyData}
					buttonText={buttonText}
					buttonIcon={buttonIcon}
					isButtonLoading={isQRLoading}
					onButtonPress={handleButtonPress}
				/>

				<View style={styles.actionButtonRow}>
					<Button
						style={styles.actionButton}
						text={t('common.share')}
						icon={shareIcon}
						onPress={onSharePress}
					/>
					<Button
						style={styles.actionButton}
						text={t('backup.backup')}
						icon={backupIcon}
						onPress={onBackup}
					/>
					<Button
						style={styles.actionButton}
						text={t('common.delete')}
						icon={deleteIcon}
						onPress={onDelete}
					/>
				</View>
			</View>
		);
	},
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 24,
	},
	actionButtonRow: {
		flexDirection: 'row',
		gap: 6,
		marginTop: 24,
	},
	actionButton: {
		flex: 1,
	},
});

export default PubkyDetailCard;
