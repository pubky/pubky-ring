import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Pubky } from '../types/pubky.ts';
import { Dispatch } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import {
	SessionText,
	Box,
	ForegroundView,
	ActivityIndicator,
	QrCode,
	NavView,
	Card,
	View,
	Text,
	AuthorizeButton,
	ArrowRight,
	CardView,
	Button,
	LinearGradient,
} from '../theme/components.ts';
import { truncateStr } from '../utils/pubky.ts';
import Jdenticon from './Jdenticon.tsx';
import { getIsOnline } from '../store/selectors/settingsSelectors.ts';
import { showEditPubkyPrompt } from '../utils/helpers.ts';

interface PubkyBoxProps {
	pubky: string;
	pubkyData: Pubky;
	sessionsCount?: number;
	onQRPress: ({
		pubky,
		dispatch,
		onComplete,
		isOnline,
	}: {
		pubky: string;
		dispatch: Dispatch;
		onComplete?: () => void;
		isOnline: boolean;
	}) => Promise<string>;
	onPress: (data: string, index: number) => void;
	index?: number;
	onLongPress?: () => void;
	disabled?: boolean;
}

const PubkyBox = ({
	pubky,
	pubkyData,
	sessionsCount = 0,
	onQRPress,
	onPress,
	index,
	onLongPress,
	disabled,
}: PubkyBoxProps): ReactElement => {
	const [isQRLoading, setIsQRLoading] = useState(false);
	const dispatch = useDispatch();
	const isOnline = useSelector(getIsOnline);

	const handleQRPress = useCallback(async () => {
		setIsQRLoading(true);
		try {
			await onQRPress({
				pubky,
				dispatch,
				isOnline,
			});
		} finally {
			setIsQRLoading(false);
		}
	}, [dispatch, isOnline, onQRPress, pubky]);

	const handleOnPress = useCallback(() => {
		onPress(pubky, index ?? 0);
	}, [index, onPress, pubky]);

	const publicKey = useMemo(
		() => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky),
		[pubky],
	);

	const pubkyName = useMemo(() => {
		return truncateStr(pubkyData.name, 8) || `pubky #${index ? index + 1 : 1}`;
	}, [index, pubkyData.name]);

	const qrPress = useCallback(() => {
		if (pubkyData.signedUp) {
			handleQRPress();
		} else {
			showEditPubkyPrompt({
				title: 'Setup',
				description: '',
				pubky: pubky,
				data: pubkyData,
			});
		}
	}, [handleQRPress, pubky, pubkyData]);

	return (
		<LinearGradient style={styles.container}>
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
					<AuthorizeButton
						style={[
							styles.actionButton,
							isQRLoading && styles.actionButtonDisabled,
						]}
						onPress={qrPress}
						onLongPress={onLongPress}
						disabled={isQRLoading}>
						{isQRLoading ? (
							<ActivityIndicator size="small" />
						) : (
							pubkyData.signedUp ? <QrCode size={16} /> : null
						)}
						<Text style={styles.buttonText}>{pubkyData.signedUp ? 'Authorize' : 'Setup'}</Text>
					</AuthorizeButton>
				</ForegroundView>
			</Button>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	container: {
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
		marginHorizontal: 24,
	},
	wrapper: {
		borderRadius: 16,
		padding: 24,
		backgroundColor: 'transparent',
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
		...Platform.select({
			android: {
				paddingBottom: 4,
			},
		}),
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
		backgroundColor: 'transparent',
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
		backgroundColor: 'transparent',
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
		width: '100%',
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
