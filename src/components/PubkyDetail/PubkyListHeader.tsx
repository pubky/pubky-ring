import React, {
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import { copyToClipboard } from '../../utils/clipboard.ts';
import { PubkyData } from '../../navigation/types.ts';
import {
	View,
	Text,
	ActionButton,
	ActivityIndicator,
	QrCode,
	Card,
	Save,
	Trash2,
	Share,
	LinearGradient,
	AuthorizeButton,
} from '../../theme/components.ts';
import Button from '../Button.tsx';
import { shareData, showEditPubkyPrompt, showToast } from '../../utils/helpers.ts';
import ProfileAvatar from '../ProfileAvatar.tsx';

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

	const handleCopyPubky = useCallback(() => {
		copyToClipboard(pubky);
		showToast({
			type: 'info',
			title: 'Pubky copied',
			description: 'Your Pubky has been copied to the clipboard',
		});
	}, [pubky]);

	const handleOnQRPress = useCallback(async () => {
		if (!pubkyData.signedUp) {
			showEditPubkyPrompt({
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

	const pubkyUri = useMemo(() => pubky.startsWith('pk:') ? pubky : `pk:${pubky}`, [pubky]);
	const onSharePress = useCallback(() => {
		shareData(pubkyUri).then();
	}, [pubkyUri]);

	const pubkyName = useMemo(() => {
		if (pubkyData?.name) {
			return pubkyData.name;
		}
		return `pubky #${index + 1}`;
	}, [index, pubkyData.name]);

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
				<View style={styles.profileContainer}>
					<Card style={styles.profile}>
						<View style={styles.avatarContainer}>
							<ProfileAvatar pubky={pubky} size={86} />
						</View>

						<Text style={styles.nameText}>{pubkyName}</Text>

						<ActionButton style={styles.pubkyButton} onPress={handleCopyPubky} activeOpacity={0.7}>
							<Text style={styles.pubkyText}>{pubkyUri}</Text>
						</ActionButton>
					</Card>
					<AuthorizeButton
						style={styles.authorizeButton}
						onPressIn={handleOnQRPress}
					>
						<View style={styles.row}>
							{isQRLoading ? (<ActivityIndicator size="small" />) : (
								<>
									{pubkyData.signedUp ? <QrCode size={16} /> : null}
									<Text style={styles.buttonText}>{pubkyData.signedUp ? 'Authorize' : 'Setup'}</Text>
								</>
							)}
						</View>
					</AuthorizeButton>
				</View>
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
	profileSection: {
		alignItems: 'center',
		borderRadius: 16,
		width: '100%',
	},
	profileContainer: {
		padding: 36,
		backgroundColor: 'transparent',
	},
	profile: {
		alignItems: 'center',
		width: '100%',
		backgroundColor: 'transparent',
		paddingBottom: 16,
	},
	authorizeButtonContainer: {
	},
	authorizeButton: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
		borderWidth: 1,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
	},
	row: {
		flex: 1,
		backgroundColor: 'transparent',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
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
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5,
	},
	avatarContainer: {
		width: 96,
		height: 96,
		borderRadius: 60,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
		marginBottom: 8,
	},
	nameText: {
		fontSize: 26,
		fontWeight: '300',
		marginBottom: 8,
		textAlign: 'center',
		backgroundColor: 'transparent',
	},
	pubkyText: {
		fontSize: 17,
		fontFamily: 'monospace',
		textAlign: 'center',
		marginBottom: 8,
		fontWeight: 600,
		lineHeight: 22,
		letterSpacing: 0.4,
	},
	actionButtonDisabled: {
		opacity: 0.7,
	},
	pubkyButton: {
		backgroundColor: 'transparent',
	},
});

export default memo(PubkyListHeader);
