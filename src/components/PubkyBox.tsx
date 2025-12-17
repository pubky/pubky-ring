import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { EBackupPreference, Pubky } from '../types/pubky.ts';
import { useQRScanner } from '../hooks/useQRScanner';
import {
	ActivityIndicator,
	ArrowRight,
	AuthorizeButton,
	Box,
	Button,
	Card,
	CardView,
	ForegroundView,
	LinearGradient,
	NavView,
	QrCode,
	SessionText,
	Text,
	TouchableOpacity,
	View,
} from '../theme/components.ts';
import { truncateStr } from '../utils/pubky.ts';
import ProfileAvatar from './ProfileAvatar.tsx';
import { buttonStyles, shadowStyles, textStyles } from '../theme/utils';
import { usePubkyHandlers } from '../hooks/usePubkyHandlers';
import { showEditPubkySheet, showBackupPrompt } from "../utils/sheetHelpers.ts";
import i18n from '../i18n';

interface AuthorizeQRButtonProps {
	isLoading: boolean;
	isSignedUp: boolean;
	onPress: () => void;
	onLongPress?: () => void;
}

const AuthorizeQRButton = memo(({
	isLoading,
	isSignedUp,
	onPress,
	onLongPress
}: AuthorizeQRButtonProps) => (
	<AuthorizeButton
		style={[
			styles.actionButton,
			isLoading && styles.actionButtonDisabled,
		]}
		onPress={onPress}
		onLongPress={onLongPress}
		disabled={isLoading}>
		{isLoading ? (
			<ActivityIndicator size="small" />
		) : (
			isSignedUp ? <QrCode size={16} /> : null
		)}
		<Text
			style={textStyles.button}
			numberOfLines={1}
			adjustsFontSizeToFit
			minimumFontScale={0.8}
		>{isLoading ? '' : isSignedUp ? i18n.t('auth.authorize') : i18n.t('pubky.setup')}</Text>
	</AuthorizeButton>
));

interface PubkyInfoProps {
	pubkyName: string;
	publicKey: string;
	sessionsCount: number;
	isBackedUp: boolean;
}

const PubkyInfo = memo(({
	pubkyName,
	publicKey,
	sessionsCount,
	isBackedUp,
}: PubkyInfoProps) => {
	const handleBackupPress = useCallback(() => {
		showBackupPrompt({ pubky: publicKey, backupPreference: EBackupPreference.unknown });
	}, [publicKey]);
	return (
		<View style={styles.contentContainer}>
			<Text style={[textStyles.heading, styles.nameText]} numberOfLines={1}>
				{pubkyName}
			</Text>
			<Card style={styles.row}>
				<Text style={textStyles.body} numberOfLines={1} ellipsizeMode="middle">
					{truncateStr(publicKey)}
				</Text>
				{!isBackedUp && <TouchableOpacity onPress={handleBackupPress} style={styles.backupContainer}><Text
					style={textStyles.backupText}>{i18n.t('pubkyProfile.backupReminder')}</Text></TouchableOpacity>}
				{sessionsCount > 0 && (
					<CardView style={styles.sessionsButton}>
						<SessionText style={textStyles.button}>{sessionsCount}</SessionText>
					</CardView>
				)}
			</Card>
		</View>
	);
});

interface PubkyBoxProps {
	pubky: string;
	pubkyData: Pubky;
	sessionsCount?: number;
	index?: number;
	onLongPress?: () => void;
	disabled?: boolean;
  loading?: boolean;
}

const PubkyBox = ({
	pubky,
	pubkyData,
	sessionsCount = 0,
	index,
	onLongPress,
	disabled,
	loading = false,
}: PubkyBoxProps): ReactElement => {
	const { handleQRPress, isQRLoading } = useQRScanner();
	const { onQRPress, onPubkyPress } = usePubkyHandlers();

	const handleQRAction = useCallback(async () => {
		await handleQRPress(pubky, onQRPress);
	}, [handleQRPress, onQRPress, pubky]);

	const handleOnPress = useCallback(() => {
		onPubkyPress(pubky, index ?? 0);
	}, [index, onPubkyPress, pubky]);

	const publicKey = useMemo(
		() => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky),
		[pubky],
	);

	const pubkyName = useMemo(() => {
		return truncateStr(pubkyData.name, 8) || `${i18n.t('emptyState.placeholderName')} #${index ? index + 1 : 1}`;
	}, [index, pubkyData.name]);

	const qrPress = useCallback(() => {
		if (pubkyData.signedUp) {
			handleQRAction();
		} else {
			showEditPubkySheet({
				title: i18n.t('pubky.setup'),
				description: '',
				pubky: pubky,
				data: pubkyData,
			});
		}
	}, [handleQRAction, pubky, pubkyData]);

	// testId example: PubkyBox-StagingTestPubky-0
	const pubkyBoxTestID = useMemo(() => {
		const sanitizedName = pubkyData.name.replace(/[^a-zA-Z0-9]/g, '');
		const indexStr = index !== undefined ? `-${index}` : '';
		return `PubkyBox-${sanitizedName}${indexStr}`;
	}, [pubkyData.name, index]);

	return (
		<LinearGradient testID={pubkyBoxTestID} style={styles.container}>
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
							<ProfileAvatar pubky={publicKey} size={38} />
						</NavView>
					</ForegroundView>

					<PubkyInfo
						pubkyName={pubkyName}
						publicKey={publicKey}
						isBackedUp={pubkyData.isBackedUp}
						sessionsCount={sessionsCount}
					/>

					<ForegroundView style={styles.buttonArrow}>
						<ArrowRight size={24} />
					</ForegroundView>
				</Box>

				<ForegroundView style={styles.buttonsContainer}>
					<AuthorizeQRButton
						isLoading={isQRLoading || loading}
						isSignedUp={pubkyData.signedUp}
						onPress={qrPress}
						onLongPress={onLongPress}
					/>
				</ForegroundView>
			</Button>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		alignSelf: 'center',
		...shadowStyles.small,
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
		flexWrap: 'nowrap',
	},
	actionButton: {
		...buttonStyles.secondary,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
		width: '100%',
	},
	actionButtonDisabled: {
		opacity: 0.7,
	},
	backupContainer: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		backgroundColor: textStyles.backupTextBGColor,
		borderRadius: 16,
		marginLeft: 5,
		alignSelf: 'center',
	}
});

export default memo(PubkyBox);
