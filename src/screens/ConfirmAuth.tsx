import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { showToast } from '@synonymdev/react-native-toast';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { performAuth } from '../utils/pubky';
import { useDispatch, useSelector } from 'react-redux';
import { sleep } from '../utils/helpers.ts';
import PubkyCard from '../components/PubkyCard.tsx';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSequence,
} from 'react-native-reanimated';
import { TextSmM, TextXsM } from '../theme/typography';
import { RootState } from '../store';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import ProgressBar from '../components/ProgressBar.tsx';
import { useTranslation } from 'react-i18next';
import { openXSuccess, openXError, openXCancel } from '../utils/xCallback.ts';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import { CheckCircle, Folder } from '../icons/index.ts';
import CircularProgressBar from '../components/CircularProgressBar.tsx';
import PermissionCard from '../components/PermissionCard.tsx';
import type { AuthStackParamList } from '../sheets/types.ts';

interface Capability {
	path: string;
	permission: string;
}

const Permission = memo(({ capability }: { capability: Capability; isAuthorized: boolean }): ReactElement => {
	const { t } = useTranslation();
	const hasReadPermission = capability.permission.includes('r');
	const hasWritePermission = capability.permission.includes('w');
	return (
		<View style={styles.permissionRow}>
			<Folder size={16} />
			<View style={styles.pathContainer}>
				<TextSmM colorName="foreground">{capability.path}</TextSmM>
			</View>
			<View style={styles.permissionsContainer}>
				{hasReadPermission && (
					<TextXsM>
						{t('common.read')}
						{hasWritePermission ? ',' : ''}
					</TextXsM>
				)}
				{hasWritePermission && <TextXsM>{t('common.write')}</TextXsM>}
			</View>
		</View>
	);
});

const FADE_DURATION = 100;
const CONFIRM_AUTH_TIMEOUT_MS = 60000;

const ConfirmAuth = ({ route }: NativeStackScreenProps<AuthStackParamList, 'ConfirmAuth'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky, authUrl, authDetails, xCallback } = route.params;
	const [authorizing, setAuthorizing] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const dispatch = useDispatch();

	const pubkyName = useSelector((state: RootState) => getPubkyName(state, pubky));

	const checkOpacity = useSharedValue(0);
	const checkScale = useSharedValue(0.5); // Start half size

	const checkStyle = useAnimatedStyle(() => ({
		opacity: checkOpacity.value,
		transform: [{ scale: checkScale.value }],
		position: 'absolute',
	}));

	// Reset state and animations when pubky changes
	useEffect(() => {
		setAuthorizing(false);
		setIsAuthorized(false);
		checkOpacity.value = 0;
		checkScale.value = 0.5;
	}, [pubky, checkOpacity, checkScale]);

	useEffect(() => {
		if (authorizing) {
			checkOpacity.value = withTiming(0, { duration: FADE_DURATION });
			checkScale.value = withTiming(0.5);
		} else if (isAuthorized) {
			checkOpacity.value = withTiming(1, { duration: FADE_DURATION });
			checkScale.value = withSequence(
				// Start at half size
				withTiming(0.5, { duration: 0 }),
				// Spring to full size
				withTiming(1, { duration: 300 }),
			);
		} else {
			checkOpacity.value = withTiming(0, { duration: FADE_DURATION });
			checkScale.value = withTiming(0.5);
		}
	}, [authorizing, checkOpacity, checkScale, isAuthorized]);

	const handleClose = useCallback(() => {
		hideSheet('auth');
	}, []);

	const handleDeny = useCallback(() => {
		openXCancel(xCallback);
		handleClose();
	}, [xCallback, handleClose]);

	useEffect(() => {
		if (isAuthorized || authorizing) {
			return;
		}

		const timeout = setTimeout(handleDeny, CONFIRM_AUTH_TIMEOUT_MS);

		return () => {
			clearTimeout(timeout);
		};
	}, [authorizing, handleDeny, isAuthorized]);

	const handleAuth = useCallback(async () => {
		setAuthorizing(true);
		try {
			const res = await performAuth({
				pubky,
				authUrl,
				dispatch,
			});
			if (res.isErr()) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: res.error.message,
				});
				await openXError(xCallback, 'AUTH_FAILED', res.error.message);
				return;
			}
			setIsAuthorized(true);
			if (xCallback?.xSuccess) {
				await sleep(FADE_DURATION + 300);
				handleClose();
				await openXSuccess(xCallback);
			}
		} catch (e: unknown) {
			const error = e as Error;
			const errorMsg =
				error.message === 'Authentication request timed out'
					? t('auth.timeoutError')
					: error.message || t('confirmAuth.errorOccurred');
			showToast({
				type: 'error',
				title: t('common.error'),
				description: errorMsg,
				autoHide: true,
				durationMs: 20000,
			});
			console.error('Auth error:', error);
			await openXError(xCallback, 'AUTH_ERROR', errorMsg);
		} finally {
			setAuthorizing(false);
		}
	}, [authUrl, xCallback, dispatch, handleClose, pubky, t]);

	const authDetailCapabilities = useMemo(() => {
		return authDetails?.capabilities ?? [];
	}, [authDetails?.capabilities]);

	const titleText = isAuthorized
		? t('auth.authorizationSuccessful')
		: xCallback?.xSource
			? t('auth.authorizeForApp', { appName: xCallback.xSource })
			: t('auth.authorize');

	const headerProgress =
		Platform.OS === 'android' && !isAuthorized ? (
			<CircularProgressBar duration={CONFIRM_AUTH_TIMEOUT_MS} size={24} drain={true} />
		) : undefined;

	return (
		<SheetScreen
			id="auth"
			title={titleText}
			titleTestID="confirm-auth-title"
			showBottomSafeAreaInset={false}
			headerRight={headerProgress}
		>
			<PermissionCard style={styles.permissionsCard}>
				<TextXsM
					style={styles.sectionTitle}
					testID={isAuthorized ? 'ConfirmAuthGrantedPermissions' : 'ConfirmAuthRequestedPermissions'}
				>
					{isAuthorized ? t('auth.grantedPermissions') : t('auth.requestedPermissions')}
				</TextXsM>

				<View style={styles.permissions}>
					{authDetailCapabilities.map((capability, index) => (
						<Permission key={index} capability={capability} isAuthorized={isAuthorized} />
					))}
				</View>
			</PermissionCard>

			{!isAuthorized && (
				<TextSmM style={styles.warningText} colorName="mutedForeground">
					{t('auth.trustWarning')}
				</TextSmM>
			)}

			<View style={styles.imageContainer}>
				<Animated.View style={[styles.imageWrapper, checkStyle]}>
					<CheckCircle colorName="pubkyApp" size={128} strokeWidth={1} />
				</Animated.View>
			</View>

			<PubkyCard style={styles.card} name={pubkyName} publicKey={pubky} />

			<View style={styles.footerContainer}>
				<View style={styles.buttonContainer}>
					{!isAuthorized ? (
						<>
							<Button
								text={authorizing ? t('common.close') : t('common.cancel')}
								size="large"
								testID="ConfirmAuthCancelButton"
								onPress={handleDeny}
							/>
							<Button
								text={authorizing ? t('auth.authorizing') : t('auth.authorize')}
								size="large"
								variant="secondary"
								disabled={authorizing}
								testID="ConfirmAuthAuthorizeButton"
								onPress={handleAuth}
							/>
						</>
					) : (
						<Button
							text={t('common.ok')}
							size="large"
							variant="secondary"
							testID="ConfirmAuthSuccessButton"
							onPress={handleClose}
						/>
					)}
				</View>

				{Platform.OS === 'ios' && !isAuthorized && (
					<ProgressBar
						style={styles.progressBarContainer}
						duration={CONFIRM_AUTH_TIMEOUT_MS}
						unfilledColor="#333333"
						height={5}
						drain={true}
					/>
				)}
			</View>

			<SafeAreaInset edge="bottom" />
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	permissionsCard: {
		marginBottom: 24,
	},
	relayContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
	},
	permissions: {
		gap: 8,
	},
	sectionTitle: {
		marginBottom: 8,
	},
	relayText: {
		justifyContent: 'center',
		marginLeft: 6,
	},
	warningText: {
		marginBottom: 24,
	},
	card: {
		marginTop: 'auto',
	},
	permissionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	pathContainer: {
		flex: 2,
		marginLeft: 5,
		justifyContent: 'center',
	},
	permissionsContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	footerContainer: {
		marginTop: 24,
		justifyContent: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	progressBarContainer: {
		position: 'absolute',
		bottom: -14,
		width: 147,
		alignSelf: 'center',
	},
});

export default memo(ConfirmAuth);
