import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { beginSheetWork, hideSheet } from '../sheets/sheetNavigation.tsx';
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
	const isApprovingRef = useRef(false);
	const isMountedRef = useRef(true);

	const pubkyName = useSelector((state: RootState) => getPubkyName(state, pubky));
	const callbackTarget = useMemo(() => getCallbackTarget(xCallback?.xSuccess), [xCallback?.xSuccess]);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const closeSheet = useCallback(() => {
		hideSheet('auth');
	}, []);

	const handleDeny = useCallback(async () => {
		if (isApprovingRef.current) return;
		isApprovingRef.current = true;
		const finishSheetWork = beginSheetWork('auth');
		setIsApproving(true);
		closeSheet();
		try {
			await openXCancel(xCallback);
		} finally {
			isApprovingRef.current = false;
			finishSheetWork();
			if (isMountedRef.current) setIsApproving(false);
		}
	}, [closeSheet, xCallback]);

	const handleAllow = useCallback(async () => {
		if (isApprovingRef.current) return;
		isApprovingRef.current = true;
		const finishSheetWork = beginSheetWork('auth');
		setIsApproving(true);
		try {
			const result = await executeSessionAction(
				{
					action: InputAction.Session,
					params: { xCallback },
				},
				{ dispatch, pubky, isDeeplink: true },
			);

			if (result.isErr() || !isMountedRef.current) return;
			closeSheet();
		} finally {
			isApprovingRef.current = false;
			finishSheetWork();
			if (isMountedRef.current) setIsApproving(false);
		}
	}, [closeSheet, dispatch, pubky, xCallback]);

	return (
		<SheetScreen id="auth" title={t('session.confirmTitle')} titleTestID="confirm-session-title">
			<PermissionCard style={styles.detailsCard}>
				{xCallback?.xSource && (
					<>
						<TextXsM style={styles.sectionTitle}>{t('session.requestingApp')}</TextXsM>
						<TextBaseB style={styles.sourceText}>{xCallback.xSource}</TextBaseB>
					</>
				)}
				<TextXsM style={styles.destinationTitle}>{t('session.callbackDestination')}</TextXsM>
				<TextBaseM>{callbackTarget}</TextBaseM>
			</PermissionCard>

			<PermissionCard style={styles.detailsCard}>
				<TextXsM style={styles.sectionTitle}>{t('session.sessionPermissions')}</TextXsM>
				<TextBaseM>{t('session.rootSessionDescription')}</TextBaseM>
			</PermissionCard>

			<TextSmM style={styles.warningText} colorName="mutedForeground">
				{t('session.trustWarning')}
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
					text={isApproving ? t('session.approving') : t('session.allow')}
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
