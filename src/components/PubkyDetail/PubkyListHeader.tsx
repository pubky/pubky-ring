import React, {
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Trash2, Save } from 'lucide-react-native';
import { copyToClipboard } from '../../utils/clipboard.ts';
import { PubkyData } from '../../navigation/types.ts';
import { Result } from '@synonymdev/result';
import {
	View,
	Text,
	TouchableOpacity,
	AvatarRing,
	ActionButton,
	SessionText,
	ActivityIndicator,
	QrCode,
	Clipboard,
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

	const handleCopyHomeserver = useCallback(() => {
		copyToClipboard(pubkyData.homeserver);
		Alert.alert('Homeserver copied', 'Your Homeserver has been copied to the clipboard');
	}, [pubkyData.homeserver]);

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
		<>
			<View style={styles.profileSection}>
				<AvatarRing style={styles.avatarOuterRing}>
					<View style={styles.avatarInnerRing}>
						<View style={styles.avatarContainer}>
							<SvgXml xml={svg} />
						</View>
					</View>
				</AvatarRing>

				{pubkyData?.name ? (
					<Text style={styles.nameText}>{pubkyData.name}</Text>
        ) : null}

				<TouchableOpacity onPressIn={handleCopyPubky} activeOpacity={0.7}>
					<Text style={styles.pubkyText}>{pubkyUri}</Text>
				</TouchableOpacity>

				<TouchableOpacity onPressIn={handleCopyHomeserver} activeOpacity={0.7}>
					<SessionText style={styles.homeserverText}>
						{homeserver}
					</SessionText>
				</TouchableOpacity>

				<Text style={styles.signInLabel}>Sign in on another device</Text>
				<View style={styles.actionsContainer}>
					<ActionButton
						style={[styles.actionButton, isQRLoading && styles.actionButtonDisabled]}
						onPressIn={handleOnQRPress}
						activeOpacity={0.7}
						disabled={isQRLoading}
					>
						<View style={styles.actionButtonInner}>
							{isQRLoading ? (<ActivityIndicator size="small" />) : (<QrCode size={24} />)}
						</View>
					</ActionButton>
					<ActionButton
						style={[styles.actionButton, isClipboardLoading && styles.actionButtonDisabled]}
						onPressIn={handleOnCopyClipboard}
						activeOpacity={0.7}
						disabled={isClipboardLoading}
					>
						<View style={styles.actionButtonInner}>
							{isClipboardLoading ? (<ActivityIndicator size="small" />) : (<Clipboard size={24} />)}
						</View>
					</ActionButton>
				</View>
			</View>

			<View style={styles.managementSection}>
				<View style={styles.actionButtonsContainer}>
					<TouchableOpacity
						style={styles.backupButton}
						onPress={onBackup}
						activeOpacity={0.7}
					>
						<Save size={20} color="#0066cc" />
						<Text style={styles.backupButtonLabel}>Backup Pubky</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.deleteButton}
						onPress={onDelete}
						activeOpacity={0.7}
					>
						<Trash2 size={20} color="#ff4444" />
						<Text style={styles.deleteButtonLabel}>Delete Pubky</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.sessionsHeader}>
				<Text style={styles.sectionTitle}>Active Sessions ({sessionsCount})</Text>
			</View>
		</>
	);
});

const styles = StyleSheet.create({
	profileSection: {
		alignItems: 'center',
		padding: 24,
	},
	avatarOuterRing: {
		width: 160,
		height: 160,
		borderRadius: 80,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	avatarInnerRing: {
		width: 140,
		height: 140,
		borderRadius: 70,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#eee',
	},
	avatarContainer: {
		width: 120,
		height: 120,
		borderRadius: 60,
		borderWidth: 1,
		borderColor: '#ccc',
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
	},
	pubkyText: {
		fontSize: 14,
		fontFamily: 'monospace',
		textAlign: 'center',
		paddingHorizontal: 16,
		marginBottom: 8,
	},
	signInLabel: {
		fontSize: 16,
		fontWeight: '600',
		marginVertical: 12,
	},
	actionsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
	},
	actionButton: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 8,
	},
	actionButtonDisabled: {
		opacity: 0.7,
	},
	actionButtonInner: {
		width: 64,
		height: 64,
		borderRadius: 32,
		borderWidth: 1,
		borderColor: '#ccc',
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.08,
		shadowRadius: 1,
		elevation: 1,
	},
	managementSection: {
		paddingVertical: 24,
		paddingHorizontal: 24,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	actionButtonsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
	},
	backupButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: '#e6f0ff',
		minWidth: 140,
		justifyContent: 'center',
	},
	backupButtonLabel: {
		fontSize: 14,
		color: '#0066cc',
		marginLeft: 8,
		fontWeight: '500',
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 20,
		backgroundColor: '#fff0f0',
		minWidth: 140,
		justifyContent: 'center',
	},
	deleteButtonLabel: {
		fontSize: 14,
		color: '#ff4444',
		marginLeft: 8,
		fontWeight: '500',
	},
	sessionsHeader: {
		paddingHorizontal: 24,
		paddingVertical: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	nameText: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 8,
		textAlign: 'center',
		paddingHorizontal: 16,
	},
	homeserverText: {
		fontSize: 14,
		marginBottom: 12,
		fontStyle: 'italic',
		textAlign: 'center',
		paddingHorizontal: 16,
	},
});

export default memo(PubkyListHeader);
