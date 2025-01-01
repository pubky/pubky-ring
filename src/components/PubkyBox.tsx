import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Pubky } from '../types/pubky.ts';
import { Dispatch } from 'redux';
import { useDispatch } from 'react-redux';
import {
	SessionText,
	Box,
	ForegroundView,
	ActivityIndicator,
	QrCode,
	Clipboard,
	NavView,
	Card,
	View,
	Text,
	CardButton,
	AuthorizeButton,
	ArrowRight,
	CardView,
} from '../theme/components.ts';
import { truncatePubky } from '../utils/pubky.ts';
import Jdenticon from './Jdenticon.tsx';

interface PubkyBoxProps {
  pubky: string;
  pubkyData: Pubky;
  sessionsCount?: number;
  onQRPress: (
    pubky: string,
    pubkyData: Pubky,
    dispatch: Dispatch,
    onComplete?: () => void,
  ) => Promise<string>;
  onCopyClipboard: (
    pubky: string,
    pubkyData: Pubky,
    dispatch: Dispatch,
  ) => void;
  onPress: (data: string) => void;
  index: number;
}

const PubkyBox = ({
	pubky,
	pubkyData,
	sessionsCount = 0,
	onQRPress,
	onCopyClipboard,
	onPress,
	index,
}: PubkyBoxProps): ReactElement => {
	const [isQRLoading, setIsQRLoading] = useState(false);
	const [isClipboardLoading, setIsClipboardLoading] = useState(false);
	const dispatch = useDispatch();

	const handleQRPress = useCallback(async () => {
		setIsQRLoading(true);
		try {
			await onQRPress(pubky, pubkyData, dispatch);
		} finally {
			setIsQRLoading(false);
		}
	}, [dispatch, onQRPress, pubky, pubkyData]);

	const handleCopyClipboard = useCallback(async () => {
		setIsClipboardLoading(true);
		try {
			onCopyClipboard(pubky, pubkyData, dispatch);
		} finally {
			setIsClipboardLoading(false);
		}
	}, [dispatch, onCopyClipboard, pubky, pubkyData]);

	const handleOnPress = useCallback(() => {
		onPress(pubky);
	}, [onPress, pubky]);

	const publicKey = useMemo(
		() => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky),
		[pubky],
	);

	return (
		<Card style={styles.container}>
			<Box onPress={handleOnPress} hitSlop={40} style={styles.box} activeOpacity={0.7}>
				<ForegroundView style={styles.profileImageContainer}>
					<NavView style={styles.profileImage}>
						<Jdenticon value={publicKey} size={38} />
					</NavView>
				</ForegroundView>

				<View style={styles.contentContainer}>
					<Text style={styles.nameText} numberOfLines={1}>
						{pubkyData.name || `pubky #${index + 1}`}
					</Text>
					<Card style={styles.row}>
						<SessionText style={styles.pubkyText}>
							pk:{truncatePubky(pubky)}
						</SessionText>
						{sessionsCount > 0 && (<CardView style={styles.sessionsButton}>
							<SessionText style={styles.buttonText}>{sessionsCount}</SessionText>
						</CardView>)}
					</Card>
				</View>

				<ForegroundView style={styles.buttonArrow}>
					<ArrowRight size={24} />
				</ForegroundView>
			</Box>
			<ForegroundView style={styles.buttonsContainer}>
				<CardButton
					style={[
						styles.actionButton2,
						isClipboardLoading && styles.actionButtonDisabled,
					]}
					onPress={handleCopyClipboard}
					disabled={isClipboardLoading}>
					{isClipboardLoading ? (
						<ActivityIndicator size="small" />
					) : (
						<Clipboard size={16} />
					)}
					<Text style={styles.buttonText}>Paste</Text>
				</CardButton>
				<AuthorizeButton
					style={[
						styles.actionButton,
						isQRLoading && styles.actionButtonDisabled,
					]}
					onPress={handleQRPress}
					disabled={isQRLoading}>
					{isQRLoading ? (
						<ActivityIndicator size="small" />
					) : (
						<QrCode size={16} />
					)}
					<Text style={styles.buttonText}>Authorize</Text>
				</AuthorizeButton>
			</ForegroundView>
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '90%',
		borderRadius: 16,
		alignSelf: 'center',
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		marginBottom: 20,
	},
	box: {
		backgroundColor: 'transparent',
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileImageContainer: {
		marginRight: 12,
		backgroundColor: 'transparent',
	},
	profileImage: {
		width: 48,
		height: 48,
		borderRadius: 30,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	nameText: {
		fontSize: 26,
		fontWeight: 300,
		lineHeight: 26,
	},
	buttonArrow: {
		backgroundColor: 'transparent',
		display: 'flex',
		justifyContent: 'center',
		marginLeft: 'auto',
	},
	pubkyText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 20,
		letterSpacing: 0.4,
	},
	buttonsContainer: {
		marginTop: 20,
		justifyContent: 'center',
		backgroundColor: 'transparent',
		display: 'flex',
		flexDirection: 'row',
		gap: 12,
		width: '100%',
	},
	sessionsButton: {
		borderRadius: 100,
		height: 20,
		width: 20,
		alignContent: 'center',
		justifyContent: 'center',
		marginLeft: 4,
	},
	row: {
		flexDirection: 'row',
	},
	actionButton: {
		borderWidth: 1,
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
	},
	actionButton2: {
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		alignSelf: 'center',
	},
	actionButtonDisabled: {
		opacity: 0.7,
	},
});

export default memo(PubkyBox);
