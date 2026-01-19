import React, {
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { Image, PixelRatio, StyleSheet } from 'react-native';
import { PubkyData } from '../../navigation/types.ts';
import {
	View,
	Trash2,
	QrCode,
	LinearGradient
} from '../../theme/components.ts';
import Button from '../Button.tsx';
import { shareData } from '../../utils/helpers.ts';
import { showEditPubkySheet } from '../../utils/sheetHelpers.ts';
import PubkyProfile from '../PubkyProfile.tsx';
import i18n from '../../i18n';

interface PubkyListHeaderProps {
	index: number;
	pubky: string;
	pubkyData: PubkyData;
	sessionsCount: number;
	onQRPress: () => Promise<string>;
	onDelete: () => void;
	onBackup: () => void;
}

export const PubkyListHeader = memo(({
	index,
	pubky,
	pubkyData,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	sessionsCount,
	onQRPress,
	onDelete,
	onBackup,
}: PubkyListHeaderProps) => {
	const [fontScale] = useState(PixelRatio.getFontScale());
	const [isQRLoading, setIsQRLoading] = useState(false);

	const pubkyUri = useMemo(() => pubky.startsWith('pk:') ? pubky.slice(3) : pubky, [pubky]);
	const onSharePress = useCallback(() => {
		shareData(pubkyUri).then();
	}, [pubkyUri]);

	const handleButtonPress = useCallback(async () => {
		if (!pubkyData.signedUp) {
			showEditPubkySheet({
				title: i18n.t('pubky.setup'),
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
	}, [onQRPress, pubky, pubkyData]);

	const buttonIcon = useMemo(() => {
		if (pubkyData.signedUp) {
			return <QrCode size={16} />;
		}
		return null;
	}, [pubkyData.signedUp]);

	const buttonText = useMemo(() => {
		return pubkyData.signedUp ? i18n.t('auth.authorize') : i18n.t('pubky.setup');
	}, [pubkyData.signedUp]);

	// Return undefined instead of <></> for better performance - avoids creating empty JSX objects
	const ShareIcon = useMemo(() =>
			fontScale <= 1 ? <Image source={require('../../images/share-icon.png')} style={styles.icon} /> : undefined,
	[fontScale]
	);

	const BackupIcon = useMemo(() =>
			fontScale <= 1 ? <Image source={require('../../images/shield-icon.png')} style={styles.icon} /> : undefined,
	[fontScale]
	);

	const DeleteIcon = useMemo(() =>
			fontScale <= 1 ? <Trash2 size={24} /> : undefined,
	[fontScale]
	);

	return (
		<View style={styles.container}>
			<LinearGradient style={styles.profileSection}>
				<PubkyProfile
					index={index}
					pubky={pubky}
					pubkyData={pubkyData}
					onButtonPress={handleButtonPress}
					buttonText={buttonText}
					buttonIcon={buttonIcon}
					isButtonLoading={isQRLoading}
				/>
			</LinearGradient>

			<View style={styles.actionButtonRow}>
				<Button
					text={i18n.t('common.share')}
					icon={ShareIcon}
					onPress={onSharePress}
				/>
				<Button
					text={i18n.t('backup.backup')}
					icon={BackupIcon}
					onPress={onBackup}
				/>
				<Button
					text={i18n.t('common.delete')}
					icon={DeleteIcon}
					onPress={onDelete}
				/>
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		marginHorizontal: 20,
	},
	actionButtonRow: {
		flexDirection: 'row',
		marginTop: 24,
		width: '100%',
		justifyContent: 'space-between',
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5,
	},
	profileSection: {
		width: '100%',
		borderRadius: 16,
	},
	icon: {
		width: 24,
		height: 24,
	},
});

export default memo(PubkyListHeader);
