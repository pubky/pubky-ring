import React, { memo, ReactElement, useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';
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
import { CheckCircle, Folder, Key, UserCheck } from '../icons/index.ts';
import CircularProgressBar from '../components/CircularProgressBar.tsx';
import PermissionCard from '../components/PermissionCard.tsx';
import type { AuthStackParamList } from '../sheets/types.ts';
import { syncAuthorizedGrantsAfterAuth } from '../utils/authorizedGrants.ts';
import { getAuthorizedGrantCount } from '../store/selectors/authorizedGrantsSelectors.ts';
import {
	buildApprovedCapabilities,
	hasEncryptionCapabilities,
	type AuthCapability,
} from '../utils/authCapabilities.ts';
import { useTheme } from 'styled-components/native';
import type { Theme } from '../theme';
import { getEncryptionPermissionLabel } from '../utils/sessionDisplay.ts';

const Permission = memo(
	({
		capability,
		encryptionApproved,
		isAuthorized,
		disabled,
		onEncryptionApprovalChange,
	}: {
		capability: AuthCapability;
		encryptionApproved: boolean;
		isAuthorized: boolean;
		disabled: boolean;
		onEncryptionApprovalChange: (approved: boolean) => void;
	}): ReactElement | null => {
		const { t } = useTranslation();
		const theme = useTheme() as Theme;
		const permission =
			isAuthorized && !encryptionApproved ? capability.permission.replaceAll('e', '') : capability.permission;
		if (!permission) return null;

		const hasReadPermission = permission.includes('r');
		const hasWritePermission = permission.includes('w');
		const hasEncryptionPermission = permission.includes('e');
		const encryptionLabel = getEncryptionPermissionLabel(t, capability.path);
		return (
			<View style={styles.capabilityContainer}>
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

				{hasEncryptionPermission && (
					<View style={styles.encryptionPermissionRow}>
						<Key size={16} />
						<TextSmM style={styles.encryptionPermissionLabel} colorName="foreground">
							{encryptionLabel}
						</TextSmM>
						{!isAuthorized && (
							<Switch
								accessibilityLabel={`${encryptionLabel}: ${capability.path}`}
								disabled={disabled}
								ios_backgroundColor={theme.colors.input}
								trackColor={{ false: theme.colors.input, true: theme.colors.pubkyApp }}
								thumbColor={encryptionApproved ? theme.colors.primaryForeground : theme.colors.primary}
								value={encryptionApproved}
								onValueChange={onEncryptionApprovalChange}
							/>
						)}
					</View>
				)}
			</View>
		);
	},
);

const FADE_DURATION = 100;
const CONFIRM_AUTH_TIMEOUT_MS = 60000;

const ConfirmAuth = ({ route }: NativeStackScreenProps<AuthStackParamList, 'ConfirmAuth'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky, authUrl, authDetails, xCallback } = route.params;
	const [authorizing, setAuthorizing] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [declinedEncryptionIndexes, setDeclinedEncryptionIndexes] = useState<ReadonlySet<number>>(
		() => new Set(),
	);
	const dispatch = useDispatch();

	const pubkyName = useSelector((state: RootState) => getPubkyName(state, pubky));
	const authorizedGrantCount = useSelector((state: RootState) => getAuthorizedGrantCount(state, pubky));

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
		setDeclinedEncryptionIndexes(new Set());
	}, [authUrl, pubky, checkOpacity, checkScale]);

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
			const requestedCapabilities = authDetails.capabilities ?? [];
			const approvedCapabilities = hasEncryptionCapabilities(requestedCapabilities)
				? buildApprovedCapabilities(requestedCapabilities, declinedEncryptionIndexes)
				: undefined;
			const res = await performAuth({
				pubky,
				authUrl,
				dispatch,
				approvedCapabilities,
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
	}, [
		authDetails.capabilities,
		authDetails.kind,
		authUrl,
		authorizedGrantCount,
		declinedEncryptionIndexes,
		xCallback,
		dispatch,
		handleClose,
		pubky,
		t,
	]);

	const authDetailCapabilities = authDetails.capabilities ?? [];
	const hasApprovedEncryption = authDetailCapabilities.some(
		(capability, index) => capability.permission.includes('e') && !declinedEncryptionIndexes.has(index),
	);
	const showIdentityVerification = isAuthorized
		? buildApprovedCapabilities(authDetailCapabilities, declinedEncryptionIndexes) === ''
		: !authDetailCapabilities.some(capability => capability.permission.length > 0);
	const handleEncryptionApprovalChange = useCallback((index: number, approved: boolean): void => {
		setDeclinedEncryptionIndexes(current => {
			const updated = new Set(current);
			if (approved) {
				updated.delete(index);
			} else {
				updated.add(index);
			}
			return updated;
		});
	}, []);

	const requestingClient = authDetails.client_id || xCallback?.xSource;
	const titleText = isAuthorized
		? requestingClient
			? t('auth.authorizedForApp', { appName: requestingClient })
			: t('auth.authorizationSuccessful')
		: requestingClient
			? t('auth.authorizeForApp', { appName: requestingClient })
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
					testID={
						showIdentityVerification
							? 'ConfirmAuthIdentityVerification'
							: isAuthorized
								? 'ConfirmAuthGrantedPermissions'
								: 'ConfirmAuthRequestedPermissions'
					}
				>
					{showIdentityVerification
						? t('auth.identityVerification')
						: isAuthorized
							? t('auth.grantedPermissions')
							: t('auth.requestedPermissions')}
				</TextXsM>

				{showIdentityVerification ? (
					<View style={styles.identityVerificationRow}>
						<UserCheck size={16} />
						<TextSmM style={styles.identityVerificationLabel} colorName="foreground">
							{isAuthorized ? t('auth.identityVerified') : t('auth.provePubkyControl')}
						</TextSmM>
					</View>
				) : (
					<View style={styles.permissions}>
						{authDetailCapabilities.map((capability, index) => (
							<Permission
								key={`${capability.path}:${capability.permission}:${index}`}
								capability={capability}
								disabled={authorizing}
								encryptionApproved={!declinedEncryptionIndexes.has(index)}
								isAuthorized={isAuthorized}
								onEncryptionApprovalChange={(approved): void =>
									handleEncryptionApprovalChange(index, approved)
								}
							/>
						))}
					</View>
				)}
				{!isAuthorized && hasApprovedEncryption && (
					<TextSmM style={styles.encryptionWarning}>{t('auth.encryptionKeysWarning')}</TextSmM>
				)}
			</PermissionCard>

			{showIdentityVerification ? (
				<TextSmM style={styles.warningText} colorName="mutedForeground">
					{isAuthorized ? t('auth.identityVerifiedDescription') : t('auth.identityVerificationWarning')}
				</TextSmM>
			) : (
				!isAuthorized && (
					<TextSmM style={styles.warningText} colorName="mutedForeground">
						{t('auth.trustWarning')}
					</TextSmM>
				)
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
		gap: 12,
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
	capabilityContainer: {
		gap: 8,
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
	identityVerificationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	identityVerificationLabel: {
		flex: 1,
	},
	encryptionPermissionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	encryptionPermissionLabel: {
		flex: 1,
	},
	encryptionWarning: {
		marginTop: 12,
		fontSize: 12,
		lineHeight: 18,
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
