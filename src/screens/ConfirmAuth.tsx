import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { showToast } from '@synonymdev/react-native-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSequence,
} from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { performAuth, truncatePubky } from '../utils/pubky';
import { DeviceAuthError } from '../utils/deviceAuth';
import { sleep } from '../utils/helpers.ts';
import { TextBaseB, TextSmM, TextXsM } from '../theme/typography';
import type { RootState } from '../store';
import type { Theme } from '../theme';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { getAlwaysShowAuthDetails } from '../store/selectors/settingsSelectors.ts';
import { openXSuccess, openXError, openXCancel } from '../utils/xCallback.ts';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import { CheckCircle, Eye, Folder, Globe, List, Lock, Pencil, UserCheck } from '../icons/index.ts';
import CircularProgressBar from '../components/CircularProgressBar.tsx';
import PermissionCard from '../components/PermissionCard.tsx';
import AuthIdentity from '../components/AuthIdentity.tsx';
import AuthSummary from '../components/AuthSummary.tsx';
import SwipeToConfirm from '../components/SwipeToConfirm.tsx';
import type { AuthStackParamList } from '../sheets/types.ts';
import { syncAuthorizedGrantsAfterAuth } from '../utils/authorizedGrants.ts';
import { getAuthorizedGrantCount } from '../store/selectors/authorizedGrantsSelectors.ts';
import {
	buildApprovedCapabilities,
	hasEncryptionCapabilities,
	type AuthCapability,
} from '../utils/authCapabilities.ts';

const Permission = memo(
	({
		capability,
		encryptionApproved,
	}: {
		capability: AuthCapability;
		encryptionApproved: boolean;
	}): ReactElement => {
		const { t } = useTranslation();
		const read = capability.permission.includes('r');
		const write = capability.permission.includes('w');
		const encrypt = capability.permission.includes('e') && encryptionApproved;
		const label = [read && t('common.read'), write && t('common.write'), encrypt && t('auth.encryptedData')]
			.filter(Boolean)
			.join(', ');
		return (
			<View
				style={styles.permissionRow}
				accessible
				accessibilityLabel={`${capability.path}: ${label || t('activeSession.noPermissions')}`}
			>
				<Folder size={16} />
				<TextSmM style={styles.path} colorName="foreground">
					{capability.path}
				</TextSmM>
				<View style={styles.permissions}>
					<Eye size={16} colorName={read ? 'foreground' : 'border'} />
					<Pencil size={16} colorName={write ? 'foreground' : 'border'} />
					<Lock size={16} colorName={encrypt ? 'foreground' : 'border'} />
				</View>
			</View>
		);
	},
);

const FADE_DURATION = 100;
const CONFIRM_AUTH_TIMEOUT_MS = 60000;

type Props = NativeStackScreenProps<AuthStackParamList, 'ConfirmAuth'>;

const ConfirmAuthRequest = ({ route, navigation }: Props): ReactElement => {
	const { t } = useTranslation();
	const theme = useTheme() as Theme;
	const { pubky, authUrl, authDetails, xCallback, expectedSigner } = route.params;
	const dispatch = useDispatch();
	const alwaysShowDetails = useSelector(getAlwaysShowAuthDetails);
	const [showDetails, setShowDetails] = useState(alwaysShowDetails);
	const [authorizing, setAuthorizing] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [encryptionApproved, setEncryptionApproved] = useState(true);
	const request = useRef({ authorizing: false, finished: false });
	const activeAuth = useRef<AbortController | null>(null);
	useEffect(
		() => () => {
			activeAuth.current?.abort();
			request.current.finished = true;
		},
		[],
	);
	const pubkyName = useSelector((state: RootState) => getPubkyName(state, pubky));
	const authorizedGrantCount = useSelector((state: RootState) => getAuthorizedGrantCount(state, pubky));
	const capabilities = useMemo(() => authDetails.capabilities ?? [], [authDetails.capabilities]);
	const hasEncryption = hasEncryptionCapabilities(capabilities);
	const approvedCapabilities = useMemo(
		() => buildApprovedCapabilities(capabilities, encryptionApproved),
		[capabilities, encryptionApproved],
	);
	const identityOnly = !capabilities.some(capability => capability.permission.length > 0);
	const requestingClient = authDetails.client_id || xCallback?.xSource;
	const checkOpacity = useSharedValue(0);
	const checkScale = useSharedValue(0.5);
	const checkStyle = useAnimatedStyle(() => ({
		opacity: checkOpacity.get(),
		transform: [{ scale: checkScale.get() }],
	}));

	useEffect(() => {
		if (isAuthorized) {
			checkOpacity.set(withTiming(1, { duration: FADE_DURATION }));
			checkScale.set(withSequence(withTiming(0.5, { duration: 0 }), withTiming(1, { duration: 300 })));
		}
	}, [checkOpacity, checkScale, isAuthorized]);

	useFocusEffect(
		useCallback(() => {
			if (!showDetails || isAuthorized || authorizing) return;
			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				setShowDetails(false);
				return true;
			});
			return () => subscription.remove();
		}, [showDetails, isAuthorized, authorizing]),
	);

	const handleClose = useCallback(() => {
		activeAuth.current?.abort();
		hideSheet('auth');
	}, []);
	const handleDeny = useCallback(() => {
		if (!request.current.finished) {
			request.current.finished = true;
			openXCancel(xCallback);
		}
		handleClose();
	}, [request, xCallback, handleClose]);

	useEffect(
		() =>
			navigation.getParent()?.addListener('beforeRemove', () => {
				if (!request.current.finished) {
					activeAuth.current?.abort();
					request.current.finished = true;
					openXCancel(xCallback);
				}
			}),
		[navigation, xCallback],
	);

	useEffect(() => {
		if (isAuthorized) return;
		const timeout = setTimeout(handleDeny, CONFIRM_AUTH_TIMEOUT_MS);
		return () => clearTimeout(timeout);
	}, [handleDeny, isAuthorized]);

	const handleAuth = useCallback(async () => {
		if (request.current.authorizing || request.current.finished) return;
		request.current.authorizing = true;
		const controller = new AbortController();
		activeAuth.current = controller;
		setAuthorizing(true);
		try {
			const approval = hasEncryption
				? approvedCapabilities.map(({ path, permission }) => `${path}:${permission}`).join(',')
				: undefined;
			const res = await performAuth({
				pubky,
				authUrl,
				dispatch,
				approvedCapabilities: approval,
				signal: controller.signal,
			});
			if (controller.signal.aborted || request.current.finished) return;
			if (res.isErr()) {
				if (res.error instanceof DeviceAuthError && res.error.code === 'cancelled') return;
				showToast({
					type: 'error',
					title: t('common.error'),
					description: res.error.message,
				});
				if (!(res.error instanceof DeviceAuthError))
					await openXError(xCallback, 'AUTH_FAILED', res.error.message);
				return;
			}
			request.current.finished = true;
			setIsAuthorized(true);
			syncAuthorizedGrantsAfterAuth({
				pubky,
				dispatch,
				currentCount: authorizedGrantCount,
				isGrantAuth: authDetails.kind === 'signin_grant' || authDetails.kind === 'signup_grant',
			}).then();
			if (xCallback?.xSuccess) {
				await sleep(FADE_DURATION + 300);
				handleClose();
				await openXSuccess(xCallback);
			}
		} catch (e: unknown) {
			if (controller.signal.aborted || request.current.finished) return;
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
			request.current.authorizing = false;
			if (activeAuth.current === controller) activeAuth.current = null;
			if (!request.current.finished) setAuthorizing(false);
		}
	}, [
		approvedCapabilities,
		authDetails.kind,
		authUrl,
		authorizedGrantCount,
		hasEncryption,
		xCallback,
		dispatch,
		handleClose,
		pubky,
		t,
		request,
	]);

	return (
		<SheetScreen
			id="auth"
			title={t(isAuthorized ? 'auth.authorizedTitle' : 'auth.authorize')}
			titleTestID="confirm-auth-title"
			showBottomSafeAreaInset={false}
			showBackButton={!isAuthorized && !authorizing}
			onBackPress={showDetails ? () => setShowDetails(false) : undefined}
			headerRight={
				!isAuthorized ? <CircularProgressBar duration={CONFIRM_AUTH_TIMEOUT_MS} size={24} drain /> : undefined
			}
		>
			<ScrollView
				key={isAuthorized ? 'success' : showDetails ? 'details' : 'basic'}
				testID="ConfirmAuthDetailsScrollView"
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				onAccessibilityEscape={handleDeny}
			>
				{expectedSigner && !isAuthorized && (
					<View style={styles.expectedIdentity} testID="ConfirmAuthExpectedIdentity">
						<TextBaseB color="#061a2f">
							{pubkyName
								? t('auth.expectedIdentityTitle', {
										appName: requestingClient || t('auth.thisApp'),
										name: pubkyName,
										pubky: truncatePubky(pubky),
									})
								: t('auth.expectedIdentityTitleNoName', {
										appName: requestingClient || t('auth.thisApp'),
										pubky: truncatePubky(pubky),
									})}
						</TextBaseB>
						<TextSmM color="#061a2f">{t('auth.expectedIdentityDescription')}</TextSmM>
					</View>
				)}
				{isAuthorized ? (
					<>
						<AuthSummary capabilities={approvedCapabilities} authorized />
						<View style={styles.hero}>
							<Animated.View style={checkStyle}>
								<CheckCircle colorName="pubkyApp" size={96} strokeWidth={1} />
							</Animated.View>
							<AuthIdentity name={pubkyName} pubky={pubky} />
						</View>
					</>
				) : showDetails ? (
					<>
						<View style={styles.cards}>
							<PermissionCard
								testID={identityOnly ? 'ConfirmAuthIdentityVerification' : 'ConfirmAuthRequestedPermissions'}
							>
								{identityOnly ? (
									<>
										<TextXsM style={styles.sectionTitle}>{t('auth.identityVerification')}</TextXsM>
										<View style={styles.permissionRow}>
											<UserCheck size={16} />
											<TextSmM colorName="foreground" style={styles.path}>
												{t('auth.provePubkyControl')}
											</TextSmM>
										</View>
									</>
								) : (
									<>
										<View style={styles.permissionHeader}>
											<TextXsM>{t('auth.folder')}</TextXsM>
											<TextXsM>{t('auth.permissions')}</TextXsM>
										</View>
										<View style={styles.permissionList}>
											{capabilities.map((capability, index) => (
												<Permission
													key={`${capability.path}:${index}`}
													capability={capability}
													encryptionApproved={encryptionApproved}
												/>
											))}
										</View>
									</>
								)}
							</PermissionCard>
							{hasEncryption && (
								<PermissionCard>
									<TextXsM style={styles.sectionTitle}>{t('auth.encryptedData')}</TextXsM>
									<View style={styles.permissionRow}>
										<Lock size={16} />
										<TextSmM style={styles.path} colorName="foreground">
											{t('auth.allowEncryptedData')}
										</TextSmM>
										<Pressable
											testID="AuthEncryptionToggle"
											accessibilityRole="switch"
											accessibilityLabel={t('auth.allowEncryptedData')}
											accessibilityState={{ checked: encryptionApproved, disabled: authorizing }}
											disabled={authorizing}
											hitSlop={12}
											style={[
												styles.encryptionSwitch,
												{ backgroundColor: encryptionApproved ? theme.colors.blue : theme.colors.input },
											]}
											onPress={() => setEncryptionApproved(current => !current)}
										>
											<View
												style={[
													styles.switchThumb,
													{
														backgroundColor: theme.colors.background,
														transform: [{ translateX: encryptionApproved ? 16 : 0 }],
													},
												]}
											/>
										</Pressable>
									</View>
								</PermissionCard>
							)}
							{!!authDetails.relay && (
								<PermissionCard>
									<TextXsM style={styles.sectionTitle}>{t('auth.relay')}</TextXsM>
									<View style={styles.permissionRow}>
										<Globe size={16} />
										<TextSmM colorName="foreground" style={styles.path} selectable>
											{authDetails.relay}
										</TextSmM>
									</View>
								</PermissionCard>
							)}
						</View>
						<View style={styles.spacer} />
						<TextSmM>
							{t(
								identityOnly
									? 'auth.identityVerificationWarning'
									: hasEncryption
										? 'auth.encryptionTrustWarning'
										: 'auth.trustWarning',
							)}
						</TextSmM>
					</>
				) : (
					<>
						<AuthSummary capabilities={approvedCapabilities} authorized={false} />
						<View style={styles.hero}>
							<View style={styles.shieldContainer}>
								<Image
									source={require('../images/shield.png')}
									style={styles.shield}
									resizeMode="contain"
									accessibilityIgnoresInvertColors
								/>
								<View style={styles.shieldIdentity}>
									<AuthIdentity name={pubkyName} pubky={pubky} />
								</View>
							</View>
						</View>
					</>
				)}
			</ScrollView>

			<View style={styles.footer}>
				{!isAuthorized &&
					(showDetails ? (
						<AuthIdentity name={pubkyName} pubky={pubky} fullWidth />
					) : (
						<Button
							text={t('auth.showDetails')}
							size="large"
							style={styles.fullWidthButton}
							icon={<List size={16} />}
							testID="ConfirmAuthShowDetailsButton"
							disabled={authorizing}
							onPress={() => setShowDetails(true)}
						/>
					))}
				{isAuthorized ? (
					<Button
						text={t('common.ok')}
						size="large"
						style={styles.fullWidthButton}
						variant="secondary"
						testID="ConfirmAuthSuccessButton"
						onPress={handleClose}
					/>
				) : (
					<SwipeToConfirm
						text={t(authorizing ? 'auth.authorizing' : 'auth.swipeToAuthorize')}
						loading={authorizing}
						testID="ConfirmAuthAuthorizeButton"
						onConfirm={handleAuth}
					/>
				)}
			</View>
			<SafeAreaInset edge="bottom" />
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	expectedIdentity: {
		gap: 4,
		marginBottom: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 12,
		backgroundColor: '#0085FF',
	},
	scroll: { flex: 1 },
	scrollContent: { flexGrow: 1, paddingBottom: 24 },
	cards: { gap: 24 },
	sectionTitle: { marginBottom: 8 },
	permissionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
	permissionList: { gap: 8 },
	permissionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	path: { flex: 1, minWidth: 0 },
	permissions: { flexDirection: 'row', gap: 12 },
	encryptionSwitch: { width: 36, height: 20, padding: 2, borderRadius: 10 },
	switchThumb: { width: 16, height: 16, borderRadius: 8 },
	spacer: { flex: 1, minHeight: 24 },
	hero: { flex: 1, minHeight: 200, justifyContent: 'center', alignItems: 'center', gap: 24 },
	shieldContainer: { width: '100%', maxWidth: 327, aspectRatio: 1 },
	shield: { width: '100%', height: '100%' },
	shieldIdentity: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
	footer: { gap: 24, paddingBottom: 12 },
	fullWidthButton: { flex: 0, width: '100%' },
});

// Reset consent state when the request or selected identity changes.
const ConfirmAuth = (props: Props): ReactElement => (
	<ConfirmAuthRequest key={`${props.route.params.pubky}:${props.route.params.authUrl}`} {...props} />
);

export default memo(ConfirmAuth);
