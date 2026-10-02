import React, { memo, ReactElement, useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import Button from '../components/Button.tsx';
import Card from '../components/Card.tsx';
import Sheet from '../components/Sheet.tsx';
import { Key } from '../icons/index.ts';
import type { RootStackParamList } from '../navigation/types.ts';
import { useTypedNavigation } from '../navigation/hooks.ts';
import { ThemedView } from '../theme/components.ts';
import { TextBaseB, TextBaseM, TextSmM } from '../theme/typography.ts';
import { revokeAuthorizedGrant } from '../utils/pubky.ts';
import { getGrantSubtitle } from '../utils/sessionDisplay.ts';
import { hideSheet } from './sheetNavigation.tsx';
import { useDispatch } from 'react-redux';
import { removeAuthorizedGrant } from '../store/slices/authorizedGrantsSlice.ts';
import { refreshAuthorizedGrants } from '../utils/authorizedGrants.ts';

const RevokeGrantSheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'RevokeGrantSheet'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigation = useTypedNavigation();
	const { pubky, sessionId, grant } = route.params;
	const [isRevoking, setIsRevoking] = useState(false);

	const closeSheet = useCallback((): void => {
		hideSheet('revoke-grant');
	}, []);

	const revoke = useCallback(async (): Promise<void> => {
		setIsRevoking(true);
		const result = await revokeAuthorizedGrant({
			pubky,
			sessionId,
			grantId: grant.grant_id,
		});

		if (result.isErr()) {
			showToast({
				type: 'error',
				title: t('grants.revokeFailed'),
				description: result.error.message,
			});
			setIsRevoking(false);
			return;
		}

		dispatch(removeAuthorizedGrant({ pubky, grantId: grant.grant_id }));
		refreshAuthorizedGrants({ pubky, dispatch, forceReload: true }).then();
		hideSheet('revoke-grant');
		navigation.goBack();
		showToast({
			type: 'success',
			title: t('grants.revoked'),
			description: t('grants.revokedDescription'),
		});
	}, [dispatch, grant.grant_id, navigation, pubky, sessionId, t]);

	return (
		<Sheet id="revoke-grant" title={t('grants.revoke')} gradientType="brand" showBackButton={false}>
			<TextBaseM style={styles.message}>{t('grants.revokeConfirm')}</TextBaseM>

			<Card style={styles.appCard}>
				<ThemedView style={styles.iconBox} colorName="muted">
					<Key />
				</ThemedView>
				<View style={styles.appText}>
					<TextBaseB numberOfLines={1}>{grant.client_id}</TextBaseB>
					<TextSmM numberOfLines={1}>{getGrantSubtitle(t, grant)}</TextSmM>
				</View>
			</Card>

			<View style={styles.imageContainer}>
				<Image source={require('../images/exclamation-mark.png')} style={styles.image} />
			</View>

			<View style={styles.buttonContainer}>
				<Button
					text={t('common.cancel')}
					size="large"
					disabled={isRevoking}
					testID="RevokeGrantCancelButton"
					onPress={closeSheet}
				/>
				<Button
					text={t('grants.revokeAction')}
					size="large"
					variant="secondary"
					loading={isRevoking}
					testID="RevokeGrantConfirmButton"
					onPress={revoke}
				/>
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	message: {
		marginBottom: 24,
	},
	appCard: {
		minHeight: 96,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	iconBox: {
		width: 48,
		height: 48,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	appText: {
		flex: 1,
	},
	imageContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: {
		width: 288,
		height: 288,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
});

export default memo(RevokeGrantSheet);
