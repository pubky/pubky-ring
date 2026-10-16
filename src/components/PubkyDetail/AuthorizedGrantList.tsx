import React, { Fragment, memo, ReactElement, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import { ChevronRight, Key } from '../../icons';
import { useTypedNavigation } from '../../navigation/hooks';
import { PubkyData } from '../../navigation/types';
import { ActivityIndicator, ThemedView } from '../../theme/components';
import { Text2Xl, TextBaseB, TextSmM, TextXsSb } from '../../theme/typography';
import { GrantInfo } from '../../types/pubky';
import { getGrantSubtitle } from '../../utils/sessionDisplay';
import { RootState } from '../../store';
import { getAuthorizedGrantsEntry } from '../../store/selectors/authorizedGrantsSelectors.ts';
import { refreshAuthorizedGrants } from '../../utils/authorizedGrants.ts';

type AuthorizedGrantListProps = {
	pubkyData: PubkyData;
};

type AuthorizedGrantRowProps = {
	grant: GrantInfo;
	pubky: string;
	sessionId: string;
};

const AuthorizedGrantRow = memo(({ grant, pubky, sessionId }: AuthorizedGrantRowProps): ReactElement => {
	const navigation = useTypedNavigation();
	const { t } = useTranslation();

	const handlePress = useCallback(() => {
		navigation.navigate('AuthorizedGrant', { pubky, sessionId, grant });
	}, [grant, navigation, pubky, sessionId]);

	return (
		<TouchableOpacity
			style={styles.grantRow}
			activeOpacity={0.75}
			testID={`AuthorizedGrantRow-${grant.grant_id}`}
			onPress={handlePress}
		>
			<ThemedView style={styles.iconBox} colorName="muted">
				<Key />
			</ThemedView>
			<View style={styles.grantText}>
				<TextBaseB numberOfLines={1}>{grant.client_id}</TextBaseB>
				<TextSmM numberOfLines={1}>{getGrantSubtitle(t, grant)}</TextSmM>
			</View>
			<ChevronRight colorName="foreground" />
		</TouchableOpacity>
	);
});

const AuthorizedGrantList = ({ pubkyData }: AuthorizedGrantListProps): ReactElement | null => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { grants, count, sessionId, status, error, hasLoaded } = useSelector((state: RootState) =>
		getAuthorizedGrantsEntry(state, pubkyData.pubky),
	);
	const loading = status === 'idle' || (status === 'loading' && !hasLoaded);
	const reconciling = status === 'loading' && count > grants.length;
	const showLoading = loading || reconciling;
	const showError = status === 'error';

	const loadGrants = useCallback(async (): Promise<void> => {
		await refreshAuthorizedGrants({ pubky: pubkyData.pubky, dispatch });
	}, [dispatch, pubkyData.pubky]);

	useFocusEffect(
		useCallback(() => {
			loadGrants();
		}, [loadGrants]),
	);

	if (!showLoading && !showError && (count === 0 || !sessionId)) {
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.titleRow}>
				<Text2Xl>{t('grants.title')}</Text2Xl>
				{!showError && count > 0 && (
					<ThemedView style={styles.countBadge} colorName="pubkyApp">
						<TextXsSb colorName="primaryForeground">{count}</TextXsSb>
					</ThemedView>
				)}
			</View>

			{showLoading ? (
				<View style={styles.statusRow}>
					<ActivityIndicator size="small" />
					<TextSmM>{t('grants.loading')}</TextSmM>
				</View>
			) : showError ? (
				<View style={styles.errorContainer}>
					<TextSmM>{error}</TextSmM>
					<Button text={t('common.retry')} size="small" onPress={loadGrants} />
				</View>
			) : sessionId ? (
				<View style={styles.list}>
					{grants.map((grant, grantIndex) => (
						<Fragment key={grant.grant_id}>
							<AuthorizedGrantRow grant={grant} pubky={pubkyData.pubky} sessionId={sessionId} />
							{grantIndex < grants.length - 1 && (
								<ThemedView style={styles.grantRowDivider} colorName="border" />
							)}
						</Fragment>
					))}
				</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 24,
		paddingBottom: 24,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginBottom: 16,
	},
	countBadge: {
		minWidth: 24,
		height: 20,
		paddingHorizontal: 10,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	statusRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	errorContainer: {
		alignItems: 'flex-start',
		gap: 12,
	},
	list: {
		gap: 16,
	},
	grantRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	grantRowDivider: {
		height: 1,
	},
	iconBox: {
		width: 48,
		height: 48,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	grantText: {
		flex: 1,
	},
});

export default memo(AuthorizedGrantList);
