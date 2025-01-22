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
	Button,
} from '../theme/components.ts';
import { truncateStr } from '../utils/pubky.ts';
import Jdenticon from './Jdenticon.tsx';
import { Result } from '@synonymdev/result';

interface PubkyBoxProps {
	pubky: string;
	pubkyData: Pubky;
	sessionsCount?: number;
	onQRPress: ({
		pubky,
		dispatch,
		onComplete,
	}: {
		pubky: string;
		dispatch: Dispatch;
		onComplete?: () => void;
	}) => Promise<string>;
	onCopyClipboard: ({
		pubky,
		dispatch,
	}: {
		pubky: string;
		dispatch: Dispatch;
	}) => Promise<Result<string>>;
	onPress: (data: string) => void;
	index?: number;
	onLongPress?: () => void;
	disabled?: boolean;
}

const PubkyBox = ({
	pubky,
	pubkyData,
	sessionsCount = 0,
	onQRPress,
	onCopyClipboard,
	onPress,
	index,
	onLongPress,
	disabled,
}: PubkyBoxProps): ReactElement => {
	const [isQRLoading, setIsQRLoading] = useState(false);
	const [isClipboardLoading, setIsClipboardLoading] = useState(false);
	const dispatch = useDispatch();

	const handleQRPress = useCallback(async () => {
		setIsQRLoading(true);
		try {
			await onQRPress({
				pubky,
				dispatch,
			});
		} finally {
			setIsQRLoading(false);
		}
	}, [dispatch, onQRPress, pubky]);

	const handleCopyClipboard = useCallback(async () => {
		setIsClipboardLoading(true);
		try {
			await onCopyClipboard({ pubky, dispatch });
		} finally {
			setIsClipboardLoading(false);
		}
	}, [dispatch, onCopyClipboard, pubky]);

	const handleOnPress = useCallback(() => {
		onPress(pubky);
	}, [onPress, pubky]);

	const publicKey = useMemo(
		() => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky),
		[pubky],
	);

	const pubkyName = useMemo(() => {
		return truncateStr(pubkyData.name, 8) || `pubky #${index ? index + 1 : 1}`;
	}, [index, pubkyData.name]);

	return (
		<Card style={styles.container}>
			<Button
				activeOpacity={0.7}
				onPress={handleOnPress}
				onLongPress={onLongPress}
				style={styles.wrapper}>
				<Box
					onPress={handleOnPress}
					onLongPress={onLongPress}
					disabled={disabled}
					hitSlop={40}
					style={styles.box}
					activeOpacity={0.7}
				>
					<ForegroundView style={styles.profileImageContainer}>
						<NavView style={styles.profileImage}>
							<Jdenticon value={publicKey} size={38} />
						</NavView>
					</ForegroundView>

					<View style={styles.contentContainer}>
						<Text style={styles.nameText} numberOfLines={1}>
							{pubkyName}
						</Text>
						<Card style={styles.row}>
							<Text style={styles.pubkyText}>
								pk:{truncateStr(pubky)}
							</Text>
							{sessionsCount > 0 && (
								<CardView style={styles.sessionsButton}>
									<SessionText style={styles.buttonText}>{sessionsCount}</SessionText>
								</CardView>
							)}
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
						onLongPress={onLongPress}
						disabled={isClipboardLoading}
					>
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
						onLongPress={onLongPress}
						disabled={isQRLoading}>
						{isQRLoading ? (
							<ActivityIndicator size="small" />
						) : (
							<QrCode size={16} />
						)}
						<Text style={styles.buttonText}>Authorize</Text>
					</AuthorizeButton>
				</ForegroundView>
			</Button>
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '90%',
		borderRadius: 16,
		alignSelf: 'center',
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
	wrapper: {
		borderRadius: 16,
		padding: 20,
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
		justifyContent: 'center',
		alignItems: 'flex-start',
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
		justifyContent: 'space-evenly',
		backgroundColor: 'transparent',
		display: 'flex',
		flexDirection: 'row',
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
		justifyContent: 'center',
		gap: 8,
		width: '45%',
	},
	actionButton2: {
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center',
		justifyContent: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 8,
		width: '45%',
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
