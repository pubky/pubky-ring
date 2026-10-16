import React, { ReactElement, memo, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader';
import Button from '../components/Button';
import Card from '../components/Card';
import ProfileAvatar from '../components/ProfileAvatar';
import SafeAreaInset from '../components/SafeAreaInset';
import { Folder, Key, XLogo } from '../icons';
import { useTypedRoute } from '../navigation/hooks';
import { RootState } from '../store';
import { getPubky } from '../store/selectors/pubkySelectors';
import { ThemedView } from '../theme/components';
import { TextBaseB, TextSmB, TextSmM, TextXsB, TextXsM } from '../theme/typography';
import { truncateStr } from '../utils/pubky';
import {
	formatGrantTimestamp,
	getGrantCapabilities,
	getGrantExpiryLabel,
	getGrantSubtitle,
	parseGrantPermission,
} from '../utils/sessionDisplay';
import { showSheet } from '../sheets/sheetNavigation.tsx';

const AuthorizedGrantScreen = (): ReactElement => {
	const { t } = useTranslation();
	const route = useTypedRoute<'AuthorizedGrant'>();
	const { pubky, sessionId, grant } = route.params;
	const pubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const capabilities = getGrantCapabilities(grant);
	const permissions = capabilities.map(parseGrantPermission);
	const pubkyUri = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const expiry = getGrantExpiryLabel(t, grant.expires_at);

	const handleRevoke = useCallback(() => {
		showSheet('revoke-grant', { pubky, sessionId, grant });
	}, [grant, pubky, sessionId]);

	return (
		<View style={styles.container}>
			<AppHeader title={t('grants.authorizedApp')} />
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<TextXsM style={styles.sectionTitle}>
					{t('activeSession.authorizedOn', { date: formatGrantTimestamp(grant.issued_at) })}
				</TextXsM>
				<Card style={styles.appCard}>
					<ThemedView style={styles.iconBox} colorName="muted">
						<Key />
					</ThemedView>
					<View style={styles.cardText}>
						<TextBaseB numberOfLines={2}>{grant.client_id}</TextBaseB>
						<TextSmM numberOfLines={1}>{getGrantSubtitle(t, grant)}</TextSmM>
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
					{permissions.map(({ path, actions }, index) => {
						const actionLabels = actions.flatMap(action =>
							action === 'read'
								? [t('activeSession.permissionView')]
								: [t('activeSession.permissionEdit'), t('activeSession.permissionDelete')],
						);

						return (
							<View key={`${capabilities[index]}-${index}`} style={styles.permissionRow}>
								<Folder size={16} />
								<TextXsB style={styles.permissionPath} numberOfLines={1} ellipsizeMode="middle">
									{path}
								</TextXsB>
								<TextXsM style={styles.permissionActions}>{actionLabels.join(', ')}</TextXsM>
							</View>
						);
					})}
				</View>

				<TextXsM style={styles.expiry}>{expiry}</TextXsM>

				<View style={styles.buttonContainer}>
					<Button
						text={t('grants.revoke')}
						size="large"
						icon={<XLogo />}
						testID="RevokeAuthorizedGrantButton"
						onPress={handleRevoke}
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
	appCard: {
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
		marginBottom: 24,
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
	expiry: {
		marginBottom: 48,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(AuthorizedGrantScreen);
