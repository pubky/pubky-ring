import React, { ReactElement, memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import ProfileAvatar from '../components/ProfileAvatar';
import SafeAreaView from '../components/SafeAreaView';
import { Folder, Monitor, XLogo } from '../icons';
import { useTypedNavigation, useTypedRoute } from '../navigation/hooks';
import { RootState } from '../store';
import { getPubky } from '../store/selectors/pubkySelectors';
import { TextBaseB, TextSmB, TextSmM, TextXsB, TextXsM } from '../theme/typography';
import { signOutOfHomeserver, truncateStr } from '../utils/pubky';
import {
	formatSessionTimestamp,
	getPermissionLabel,
	getSessionSubtitle,
	getSessionTitle,
} from '../utils/sessionDisplay';
import { ThemedView } from '../theme/components';
import SafeAreaInset from '../components/SafeAreaInset';

const ActiveSessionScreen = (): ReactElement => {
	const { t } = useTranslation();
	const route = useTypedRoute<'ActiveSession'>();
	const navigation = useTypedNavigation();
	const dispatch = useDispatch();
	const { pubky, sessionId } = route.params;
	const pubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const [isRemoving, setIsRemoving] = useState(false);

	const session = useMemo(() => {
		return pubkyData?.sessions.find(item => item.id === sessionId);
	}, [pubkyData?.sessions, sessionId]);
	const pubkyUri = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const sessionDate = session ? formatSessionTimestamp(session.created_at) : '';

	const handleRemovePermissions = useCallback(async () => {
		if (!session) {
			return;
		}

		setIsRemoving(true);
		await signOutOfHomeserver(pubky, session.id, dispatch);
		setIsRemoving(false);
		navigation.goBack();
	}, [dispatch, navigation, pubky, session]);

	if (!session) {
		return (
			<SafeAreaView edges={['bottom']}>
				<AppHeader title={t('activeSession.activeSession')} />
				<ScrollView contentContainerStyle={styles.scrollContent} />
			</SafeAreaView>
		);
	}

	return (
		<View style={styles.container}>
			<AppHeader title={t('activeSession.activeSession')} />
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<TextXsM style={styles.sectionTitle}>
					{t('activeSession.authorizedOn', { date: sessionDate })}
				</TextXsM>
				<Card style={styles.sessionCard}>
					<ThemedView style={styles.iconBox} colorName="muted">
						<Monitor />
					</ThemedView>
					<View style={styles.cardText}>
						<TextBaseB numberOfLines={2}>{getSessionTitle(t, session)}</TextBaseB>
						<TextSmM numberOfLines={1}>{getSessionSubtitle(t, session)}</TextSmM>
					</View>
				</Card>

				<TextXsM style={styles.sectionTitle}>{t('activeSession.authorizedWithPubky')}</TextXsM>
				<Card style={styles.pubkyCard}>
					<ProfileAvatar pubky={pubky} name={pubkyData?.name} size={48} />
					<TextSmB style={styles.pubkyText} numberOfLines={2}>
						{truncateStr(pubkyUri, 20)}
					</TextSmB>
				</Card>

				<TextXsM style={styles.sectionTitle}>{t('activeSession.grantedPermissions')}</TextXsM>
				<View style={styles.permissionList}>
					{session.capabilities.map(capability => (
						<View key={capability} style={styles.permissionRow}>
							<Folder size={16} />
							<TextXsB style={styles.permissionPath} numberOfLines={1} ellipsizeMode="middle">
								{getPermissionLabel(capability)}
							</TextXsB>
							<TextXsM style={styles.permissionActions}>{t('activeSession.permissionActions')}</TextXsM>
						</View>
					))}
				</View>

				<View style={styles.buttonContainer}>
					<Button
						text={t('activeSession.removePermissions')}
						size="large"
						icon={<XLogo />}
						loading={isRemoving}
						testID="RemoveSessionPermissionsButton"
						onPress={handleRemovePermissions}
					/>
				</View>

				<SafeAreaInset edge="bottom" />
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
	},
	scrollContent: {
		flexGrow: 1,
		paddingTop: HEADER_HEIGHT + 24,
	},
	sectionTitle: {
		marginBottom: 16,
	},
	sessionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginBottom: 24,
	},
	iconBox: {
		width: 48,
		height: 48,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardText: {
		flex: 1,
	},
	pubkyCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginBottom: 24,
	},
	pubkyText: {
		flex: 1,
	},
	permissionList: {
		gap: 16,
		marginBottom: 48,
	},
	permissionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	permissionPath: {
		flex: 1,
	},
	permissionActions: {
		textAlign: 'right',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(ActiveSessionScreen);
