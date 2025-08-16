import React, {
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import { PubkyData } from '../../navigation/types.ts';
import {
	View,
	Save,
	Trash2,
	Share,
	QrCode,
	LinearGradient
} from '../../theme/components.ts';
import Button from '../Button.tsx';
import { shareData } from '../../utils/helpers.ts';
import { showEditPubkySheet } from '../../utils/sheetHelpers.ts';
import PubkyProfile from '../PubkyProfile.tsx';

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

	const pubkyUri = useMemo(() => pubky.startsWith('pk:') ? pubky : `pk:${pubky}`, [pubky]);
	const onSharePress = useCallback(() => {
		shareData(pubkyUri).then();
	}, [pubkyUri]);

	const handleButtonPress = useCallback(async () => {
		if (!pubkyData.signedUp) {
			showEditPubkySheet({
				title: 'Setup',
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
		return pubkyData.signedUp ? 'Authorize' : 'Setup';
	}, [pubkyData.signedUp]);

	const ShareIcon = useMemo(() =>
			fontScale <= 1 ? <Share size={16} /> : <></>,
	[fontScale]
	);

	const BackupIcon = useMemo(() =>
			fontScale <= 1 ? <Save size={16} /> : <></>,
	[fontScale]
	);

	const DeleteIcon = useMemo(() =>
			fontScale <= 1 ? <Trash2 size={16} /> : <></>,
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
					text={'Share'}
					icon={ShareIcon}
					onPress={onSharePress}
				/>
				<Button
					text={'Backup'}
					icon={BackupIcon}
					onPress={onBackup}
				/>
				<Button
					text={'Delete'}
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
});

export default memo(PubkyListHeader);
