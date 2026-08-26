import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PubkyCard from '../components/PubkyCard.tsx';
import PermissionCard from '../components/PermissionCard.tsx';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { TextBaseB, TextBaseM, TextSmM, TextXsM } from '../theme/typography.ts';
import { RootState } from '../store';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { AuthStackParamList } from '../sheets/types.ts';
import { InputAction } from '../utils/inputParser';
import { executeSessionAction } from '../utils/actions/sessionAction.ts';
import { openXCancel } from '../utils/xCallback.ts';

const getCallbackTarget = (url: string | undefined): string => {
	if (!url) return '';

	const match = url.match(/^([A-Za-z][A-Za-z0-9+.-]*):\/\/([^/?#]*)/);
	if (!match) return url;

	return match[2] ? `${match[1]}://${match[2]}` : `${match[1]}://`;
};

const ConfirmSession = ({
	route,
}: NativeStackScreenProps<AuthStackParamList, 'ConfirmSession'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky, xCallback } = route.params;
	const dispatch = useDispatch();
	const [isApproving, setIsApproving] = useState(false);

	const pubkyName = useSelector((state: RootState) => getPubkyName(state, pubky));
	const callbackTarget = useMemo(() => getCallbackTarget(xCallback?.xSuccess), [xCallback?.xSuccess]);

	const closeSheet = useCallback(() => {
		hideSheet('auth');
	}, []);

	const handleDeny = useCallback(async () => {
		await openXCancel(xCallback);
		closeSheet();
	}, [closeSheet, xCallback]);

	const handleAllow = useCallback(async () => {
		setIsApproving(true);
		const result = await executeSessionAction(
			{
				action: InputAction.Session,
				params: { xCallback },
			},
			{ dispatch, pubky, isDeeplink: true },
		);

		setIsApproving(false);

		if (result.isErr()) {
			return;
		}

		closeSheet();
	}, [closeSheet, dispatch, pubky, xCallback]);

	return (
		<SheetScreen id="auth" title={t('confirmSession.confirmTitle')} titleTestID="confirm-session-title">
			<PermissionCard style={styles.detailsCard}>
				{xCallback?.xSource && (
					<>
						<TextXsM style={styles.sectionTitle}>{t('confirmSession.requestingApp')}</TextXsM>
						<TextBaseB style={styles.sourceText}>{xCallback.xSource}</TextBaseB>
					</>
				)}
				<TextXsM style={styles.destinationTitle}>{t('confirmSession.callbackDestination')}</TextXsM>
				<TextBaseM>{callbackTarget}</TextBaseM>
			</PermissionCard>

			<PermissionCard style={styles.detailsCard}>
				<TextXsM style={styles.sectionTitle}>{t('confirmSession.sessionPermissions')}</TextXsM>
				<TextBaseM>{t('confirmSession.rootSessionDescription')}</TextBaseM>
			</PermissionCard>

			<TextSmM style={styles.warningText} colorName="mutedForeground">
				{t('confirmSession.trustWarning')}
			</TextSmM>

			<View style={styles.spacer} />

			<PubkyCard style={styles.pubkyCard} name={pubkyName} publicKey={pubky} />

			<View style={styles.buttonContainer}>
				<Button
					text={t('common.cancel')}
					size="large"
					testID="ConfirmSessionCancelButton"
					disabled={isApproving}
					onPress={handleDeny}
				/>
				<Button
					text={isApproving ? t('confirmSession.approving') : t('confirmSession.allow')}
					size="large"
					variant="secondary"
					testID="ConfirmSessionAllowButton"
					loading={isApproving}
					onPress={handleAllow}
				/>
			</View>

			<SafeAreaInset edge="bottom" />
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	detailsCard: {
		marginBottom: 16,
	},
	sectionTitle: {
		marginBottom: 8,
	},
	sourceText: {
		marginBottom: 16,
	},
	destinationTitle: {
		marginBottom: 8,
	},
	warningText: {
		marginTop: 8,
	},
	spacer: {
		flex: 1,
	},
	pubkyCard: {
		marginBottom: 24,
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
});

export default memo(ConfirmSession);
