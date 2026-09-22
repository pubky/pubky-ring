import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EBackupPreference, Pubky } from '../types/pubky.ts';
import { truncateStr } from '../utils/pubky.ts';
import ProfileAvatar from './ProfileAvatar.tsx';
import { Text2Xl, TextBaseB, TextXsSb } from '../theme/typography';
import { usePubkyHandlers } from '../hooks/usePubkyHandlers';
import { showBackupSheet } from '../utils/sheetHelpers.ts';
import { showSheet } from '../sheets/sheetNavigation.tsx';
import Button from './Button.tsx';
import { ChevronRight, Scan } from '../icons/index.ts';
import Card from './Card.tsx';
import SourceAppPill from './SourceAppPill.tsx';
import { shadows } from '../theme/shadows.ts';

interface PubkyInfoProps {
	pubkyName: string;
	publicKey: string;
	sessionsCount: number;
	isBackedUp: boolean;
	sourceApp?: string;
}

const PubkyInfo = memo(({ pubkyName, publicKey, sessionsCount, isBackedUp, sourceApp }: PubkyInfoProps) => {
	const { t } = useTranslation();

	const handleBackupPress = useCallback(() => {
		showBackupSheet({ pubky: publicKey, backupPreference: EBackupPreference.unknown });
	}, [publicKey]);

	return (
		<View style={styles.contentContainer} pointerEvents="box-none">
			<View pointerEvents="none">
				<Text2Xl style={styles.nameText} numberOfLines={1}>
					{pubkyName}
				</Text2Xl>
			</View>

			<View style={styles.row} pointerEvents="box-none">
				<View pointerEvents="none">
					<TextBaseB numberOfLines={1} ellipsizeMode="middle">
						{truncateStr(publicKey)}
					</TextBaseB>
				</View>

				{!isBackedUp && (
					<TouchableOpacity
						style={styles.backupContainer}
						testID="PubkyBox-BackupButton"
						onPress={handleBackupPress}
					>
						<TextXsSb colorName="blue">{t('pubkyProfile.backupReminder')}</TextXsSb>
					</TouchableOpacity>
				)}

				{sourceApp && <SourceAppPill style={styles.sourceAppPill} />}

				{sessionsCount > 0 && (
					<View style={styles.sessionsButton}>
						<TextXsSb colorName="primaryForeground">{sessionsCount}</TextXsSb>
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
	const { onPubkyPress } = usePubkyHandlers();

	const handleOnPress = useCallback(() => {
		onPubkyPress(pubky, index ?? 0);
	}, [index, onPubkyPress, pubky]);

	const publicKey = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const pubkyName =
		pubkyData.name || `${t('emptyState.placeholderName')} #${index !== undefined ? index + 1 : 1}`;

	const canAuthorize = pubkyData.signedUp || !!pubkyData.sourceApp;

	const handleActionPress = useCallback(() => {
		if (!canAuthorize) {
			showSheet('edit-pubky', { pubky });
			return;
		}

		showSheet('auth', { screen: 'Scanner', params: { pubky } });
	}, [canAuthorize, pubky]);

	// testId example: PubkyBox-StagingTestPubky-0
	const sanitizedName = pubkyData.name.replace(/[^a-zA-Z0-9]/g, '');
	const indexStr = index !== undefined ? `-${index}` : '';
	const pubkyBoxTestID = `PubkyBox-${sanitizedName}${indexStr}`;

	return (
		<View style={styles.container} testID={pubkyBoxTestID}>
			<Card>
				<TouchableOpacity
					style={styles.cardPressTarget}
					disabled={disabled}
					activeOpacity={0.7}
					testID={`${pubkyBoxTestID}-Content`}
					onPress={handleOnPress}
					onLongPress={onLongPress}
				/>

				<View style={styles.content} pointerEvents="box-none">
					<View style={styles.profileImage} pointerEvents="none">
						<ProfileAvatar name={pubkyData.name || pubkyName} pubky={publicKey} size={48} />
					</View>

					<PubkyInfo
						pubkyName={pubkyName}
						publicKey={publicKey}
						isBackedUp={pubkyData.isBackedUp}
						sessionsCount={sessionsCount}
						sourceApp={pubkyData.sourceApp}
					/>

					<View style={styles.iconContainer} pointerEvents="none">
						<ChevronRight colorName="foreground" />
					</View>
				</View>

				<Button
					style={styles.button}
					text={canAuthorize ? t('auth.authorize') : t('pubky.setup')}
					size="large"
					variant="secondary"
					loading={loading}
					icon={canAuthorize ? <Scan /> : <></>}
					testID={`${pubkyBoxTestID}-ActionButton`}
					onPress={handleActionPress}
					onLongPress={onLongPress}
				/>
			</Card>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 24,
		marginHorizontal: 24,
	},
	cardPressTarget: {
		...StyleSheet.absoluteFill,
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
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 133, 255, 0.32)',
		borderRadius: 16,
		paddingHorizontal: 8,
		marginLeft: 8,
		height: 20,
		...shadows.sm,
	},
	sourceAppPill: {
		marginLeft: 8,
	},
	button: {
		marginTop: 16,
	},
});

export default memo(PubkyBox);
