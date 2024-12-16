import React, {
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { copyToClipboard } from '../../utils/clipboard.ts';
import { PubkyData } from '../../navigation/types.ts';
import { Result } from '@synonymdev/result';
import {
	View,
	Text,
	ActionButton,
	ActivityIndicator,
	QrCode,
	Clipboard,
	Card,
	Save,
	Trash2,
} from '../../theme/components.ts';
interface PubkyListHeaderProps {
    svg: string;
    pubky: string;
    pubkyData: PubkyData;
    sessionsCount: number;
    onQRPress: () => Promise<string>;
    onCopyClipboard: () => Promise<Result<string>>;
    onDelete: () => void;
    onBackup: () => void;
}

export const PubkyListHeader = memo(({
	svg,
	pubky,
	pubkyData,
	sessionsCount,
	onQRPress,
	onCopyClipboard,
	onDelete,
	onBackup,
}: PubkyListHeaderProps) => {
	const [isQRLoading, setIsQRLoading] = useState(false);
	const [isClipboardLoading, setIsClipboardLoading] = useState(false);

	const handleCopyPubky = useCallback(() => {
		copyToClipboard(pubky);
		Alert.alert('Pubky copied', 'Your Pubky has been copied to the clipboard');
	}, [pubky]);

	const handleOnCopyClipboard = useCallback(async () => {
		setIsClipboardLoading(true);
		try {
			await onCopyClipboard();
		} finally {
			setIsClipboardLoading(false);
		}
	}, [onCopyClipboard]);

	const handleOnQRPress = useCallback(async () => {
		setIsQRLoading(true);
		try {
			await onQRPress();
		} finally {
			setIsQRLoading(false);
		}
	}, [onQRPress]);

	const pubkyUri = useMemo(() => pubky.startsWith('pk:') ? pubky : `pk:${pubky}`, [pubky]);
	const homeserver = useMemo(() => {
		if (!pubkyData?.homeserver) {
			return 'Scan or copy homeserver to sign in/up.';
		}
		return pubkyData.homeserver;
	}, [pubkyData.homeserver]);
	return (
		<View style={styles.container}>
			<Card style={styles.profileSection}>
				<Card style={styles.profile}>
					<View style={styles.avatarContainer}>
						<SvgXml xml={svg} height={86} width={86} />
					</View>

					{pubkyData?.name ? (
						<Text style={styles.nameText}>{pubkyData.name}</Text>
					) : null}

					<ActionButton onPress={handleCopyPubky} activeOpacity={0.7}>
						<Text style={styles.pubkyText}>{pubkyUri}</Text>
					</ActionButton>
				</Card>
			</Card>

			<ActionButton
				style={styles.authorizeButton}
				onPressIn={handleOnQRPress}
			>
				{isQRLoading ? (<ActivityIndicator size="small" />) : (
					<>
						<QrCode size={16} />
						<Text style={styles.buttonText}>Authorize</Text>
					</>
				)}
			</ActionButton>

			<View style={styles.actionButtonRow}>
				<ActionButton
					style={[styles.actionButton, isClipboardLoading && styles.actionButtonDisabled]}
					onPressIn={handleOnCopyClipboard}
					activeOpacity={0.7}
					disabled={isClipboardLoading}
				>
					{isClipboardLoading ? (<ActivityIndicator size="small" />) : (
						<>
							<Clipboard size={16} />
							<Text style={styles.actionButtonText}>Copy</Text>
						</>
					)}
				</ActionButton>
				<ActionButton
					style={styles.actionButton}
					onPress={onBackup}
					activeOpacity={0.7}
				>
					<>
						<Save size={16} />
						<Text style={styles.actionButtonText}>Backup</Text>
					</>
				</ActionButton>
				<ActionButton
					style={styles.actionButton}
					onPress={onDelete}
					activeOpacity={0.7}
				>
					<>
						<Trash2 size={16} />
						<Text style={styles.actionButtonText}>Delete</Text>
					</>
				</ActionButton>
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
	},
	actionButtonInner: {
		flexDirection: 'row',
	},
	actionButton: {
		flexDirection: 'row',
		width: 110,
		height: 48,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		margin: 8,
		alignContent: 'center',
		justifyContent: 'center',
	},
	actionButtonRow: {
		flex: 1,
		flexDirection: 'row',
		marginTop: 24,
	},
	authorizeButton: {
		width: '90%',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		marginTop: 24,
		borderWidth: 1,
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5,
	},
	profileSection: {
		alignItems: 'center',
		padding: 24,
		marginHorizontal: 24,
		borderRadius: 16,
		width: '90%',
	},
	profile: {
		alignItems: 'center',
		width: '75%',
	},
	avatarContainer: {
		width: 96,
		height: 96,
		borderRadius: 60,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
		marginBottom: 8,
	},
	nameText: {
		fontSize: 26,
		fontWeight: '300',
		marginBottom: 8,
		textAlign: 'center',
	},
	pubkyText: {
		fontSize: 17,
		fontFamily: 'monospace',
		textAlign: 'center',
		paddingHorizontal: 16,
		marginBottom: 8,
		fontWeight: 600,
		lineHeight: 22,
		letterSpacing: 0.4,
	},
	actionButtonDisabled: {
		opacity: 0.7,
	},
});

export default memo(PubkyListHeader);
