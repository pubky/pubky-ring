import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EBackupPreference, Pubky } from '../types/pubky.ts';
import { useQRScanner } from '../hooks/useQRScanner';
import { truncateStr } from '../utils/pubky.ts';
import ProfileAvatar from './ProfileAvatar.tsx';
import { BodySSBText, BodySSBUnspacedText, HeadingText } from '../theme/typography';
import { usePubkyHandlers } from '../hooks/usePubkyHandlers';
import { showEditPubkySheet, showBackupPrompt } from '../utils/sheetHelpers.ts';
import Button from './Button.tsx';
import { ChevronRight, Scan } from '../icons/index.ts';
import Card from './Card.tsx';

interface PubkyInfoProps {
	pubkyName: string;
	publicKey: string;
	sessionsCount: number;
	isBackedUp: boolean;
}

const PubkyInfo = memo(({ pubkyName, publicKey, sessionsCount, isBackedUp }: PubkyInfoProps) => {
	const { t } = useTranslation();

	const handleBackupPress = useCallback(() => {
		showBackupPrompt({ pubky: publicKey, backupPreference: EBackupPreference.unknown });
	}, [publicKey]);

	return (
		<View style={styles.contentContainer}>
			<HeadingText style={styles.nameText} numberOfLines={1}>
				{pubkyName}
			</HeadingText>
			<View style={styles.row}>
				<BodySSBText numberOfLines={1} ellipsizeMode="middle">
					{truncateStr(publicKey)}
				</BodySSBText>
				{!isBackedUp && (
					<TouchableOpacity onPress={handleBackupPress} style={styles.backupContainer}>
						<BodySSBUnspacedText colorName="pubkyRing">
							{t('pubkyProfile.backupReminder')}
						</BodySSBUnspacedText>
					</TouchableOpacity>
				)}
				{sessionsCount > 0 && (
					<View style={styles.sessionsButton}>
						<BodySSBText colorName="textTertiary">{sessionsCount}</BodySSBText>
					</View>
				)}
			</View>
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
	const { t } = useTranslation();
	const { handleQRPress, isQRLoading } = useQRScanner();
	const { onQRPress, onPubkyPress } = usePubkyHandlers();

	const handleQRAction = useCallback(async () => {
		await handleQRPress(pubky, onQRPress);
	}, [handleQRPress, onQRPress, pubky]);

	const handleOnPress = useCallback(() => {
		onPubkyPress(pubky, index ?? 0);
	}, [index, onPubkyPress, pubky]);

	const publicKey = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const pubkyName =
		truncateStr(pubkyData.name, 8) ||
		`${t('emptyState.placeholderName')} #${index !== undefined ? index + 1 : 1}`;

	const qrPress = useCallback(() => {
		if (pubkyData.signedUp) {
			handleQRAction();
		} else {
			showEditPubkySheet({
				title: t('pubky.setup'),
				description: '',
				pubky: pubky,
				data: pubkyData,
			});
		}
	}, [handleQRAction, pubky, pubkyData, t]);

	// testId example: PubkyBox-StagingTestPubky-0
	const sanitizedName = pubkyData.name.replace(/[^a-zA-Z0-9]/g, '');
	const indexStr = index !== undefined ? `-${index}` : '';
	const pubkyBoxTestID = `PubkyBox-${sanitizedName}${indexStr}`;

	return (
		<TouchableOpacity
			style={styles.container}
			disabled={disabled}
			activeOpacity={0.7}
			accessible={pubkyData.signedUp}
			testID={pubkyBoxTestID}
			onPress={handleOnPress}
			onLongPress={onLongPress}
		>
			<Card>
				<View style={styles.content}>
					<View style={styles.profileImage}>
						<ProfileAvatar pubky={publicKey} size={48} />
					</View>

					<PubkyInfo
						pubkyName={pubkyName}
						publicKey={publicKey}
						isBackedUp={pubkyData.isBackedUp}
						sessionsCount={sessionsCount}
					/>

					<View style={styles.iconContainer}>
						<ChevronRight size={24} colorName="textTertiary" />
					</View>
				</View>

				<Button
					style={styles.button}
					text={pubkyData.signedUp ? t('auth.authorize') : t('pubky.setup')}
					size="medium"
					variant="secondary"
					loading={isQRLoading || loading}
					icon={pubkyData.signedUp ? <Scan size={24} /> : <></>}
					testID={`${pubkyBoxTestID}-ActionButton`}
					onPress={qrPress}
					onLongPress={onLongPress}
				/>
			</Card>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 24,
		marginHorizontal: 24,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	profileImage: {
		width: 48,
		height: 48,
		borderRadius: '50%',
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start',
	},
	nameText: {
		paddingRight: 16,
	},
	iconContainer: {
		justifyContent: 'center',
		marginLeft: 'auto',
	},
	sessionsButton: {
		alignItems: 'center',
		height: 20,
		width: 20,
		borderRadius: '50%',
		marginLeft: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.16)',
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
	},
	backupContainer: {
		alignItems: 'center',
		backgroundColor: 'rgba(0, 133, 255, 0.16)',
		borderRadius: 16,
		paddingHorizontal: 8,
		marginLeft: 8,
		height: 20,
	},
	button: {
		marginTop: 24,
	},
});

export default memo(PubkyBox);
