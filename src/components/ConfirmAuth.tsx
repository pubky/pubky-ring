import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import { AnimatedView, Folder, SessionText, Text, View, Globe, CircleCheck } from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { performAuth } from '../utils/pubky';
import { useDispatch, useSelector } from 'react-redux';
import { showToast, sleep } from '../utils/helpers.ts';
import PubkyCard from './PubkyCard.tsx';
import { useAnimatedStyle, useSharedValue, withTiming, withSequence } from 'react-native-reanimated';
import { copyToClipboard } from '../utils/clipboard.ts';
import { textStyles } from '../theme/utils';
import { RootState } from '../store';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import ProgressBar from './ProgressBar.tsx';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useTranslation } from 'react-i18next';
import { XCallbackParams } from '../utils/inputParser.ts';
import { openXSuccess, openXError, openXCancel } from '../utils/xCallback.ts';
import Button from './Button.tsx';
import Sheet from './Sheet.tsx';
import SafeAreaInset from './SafeAreaInset.tsx';

interface ConfirmAuthProps {
	pubky: string;
	authUrl: string;
	authDetails: PubkyAuthDetails;
	onComplete: () => void;
	xCallback?: XCallbackParams;
}

interface Capability {
	path: string;
	permission: string;
}

const CapabilitiesList = memo(
	({ capabilities, isAuthorized }: { capabilities: Capability[]; isAuthorized: boolean }): ReactElement => {
		const capabilitiesCount = capabilities.length;
		return (
			<>
				{capabilities.map((capability, index) => (
					<View style={styles.permissionsSection} key={index}>
						<Permission capability={capability} isAuthorized={isAuthorized} />
						{index !== capabilitiesCount - 1 && <View style={styles.spacer} />}
					</View>
				))}
			</>
		);
	},
);

const Permission = memo(
	({ capability, isAuthorized }: { capability: Capability; isAuthorized: boolean }): ReactElement => {
		const { t } = useTranslation();
		const hasReadPermission = capability.permission.includes('r');
		const hasWritePermission = capability.permission.includes('w');
		return (
			<View style={styles.permissionRow}>
				<Folder size={13} />
				<View style={styles.pathContainer}>
					<Text style={styles.pathText}>{capability.path}</Text>
				</View>
				<View style={styles.permissionsContainer}>
					{hasReadPermission && (
						<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>
							{t('common.read')}
							{hasWritePermission ? ',' : ''}
						</SessionText>
					)}
					{hasWritePermission && (
						<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>
							{t('common.write')}
						</SessionText>
					)}
				</View>
			</View>
		);
	},
);

const FADE_DURATION = 100;

const ConfirmAuth = ({ payload }: { payload: ConfirmAuthProps }): ReactElement => {
	const { t } = useTranslation();
	const { pubky, authUrl, authDetails, onComplete, xCallback } = payload;
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
		SheetManager.hide('confirm-auth');
		SystemNavigationBar.navigationShow();
	}, []);

	const handleDeny = useCallback(() => {
		openXCancel(xCallback);
		handleClose();
	}, [xCallback, handleClose]);

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
			SystemNavigationBar.navigationShow();
			onComplete?.();
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
				visibilityTime: 20000,
				onPress: () => {
					copyToClipboard(errorMsg);
					Alert.alert(t('confirmAuth.errorCopied'), errorMsg);
				},
			});
			console.error('Auth error:', error);
			await openXError(xCallback, 'AUTH_ERROR', errorMsg);
		} finally {
			setAuthorizing(false);
		}
	}, [authUrl, xCallback, dispatch, handleClose, onComplete, pubky, t]);

	const authDetailCapabilities = useMemo(() => {
		return authDetails?.capabilities ?? [];
	}, [authDetails?.capabilities]);

	const titleText = isAuthorized
		? t('auth.authorizationSuccessful')
		: xCallback?.xSource
			? t('auth.authorizeForApp', { appName: xCallback.xSource })
			: t('auth.authorize');

	return (
		<Sheet id="confirm-auth" title={titleText} showBottomSafeAreaInset={false}>
			<View style={styles.section}>
				<SessionText style={styles.sectionTitle}>
					{isAuthorized ? t('auth.grantedPermissions') : t('auth.requestedPermissions')}
				</SessionText>
				<CapabilitiesList capabilities={authDetailCapabilities} isAuthorized={isAuthorized} />
			</View>

			<PubkyCard name={pubkyName} publicKey={pubky} avatarSize={48} avatarStyle={styles.avatarContainer} />

			{!isAuthorized && <Text style={styles.warningText}>{t('auth.trustWarning')}</Text>}

			<View style={styles.imageContainer}>
				<AnimatedView style={[styles.imageWrapper, checkStyle]}>
					<CircleCheck color="rgba(200, 255, 0, 1)" size={128} />
				</AnimatedView>
			</View>

			<View style={styles.footerContainer}>
				<View style={styles.buttonContainer}>
					{!isAuthorized ? (
						<>
							<Button
								text={authorizing ? t('common.close') : t('common.cancel')}
								size="large"
								onPress={handleDeny}
							/>
							<Button
								text={authorizing ? t('auth.authorizing') : t('auth.authorize')}
								size="large"
								variant="secondary"
								disabled={authorizing}
								onPress={handleAuth}
							/>
						</>
					) : (
						<Button text={t('common.ok')} size="large" variant="secondary" onPress={handleClose} />
					)}
				</View>

				<SafeAreaInset edge="bottom" />

				{!isAuthorized && (
					<ProgressBar
						style={styles.progressBarContainer}
						duration={60000}
						//fadeIn={true}
						//fadeInDuration={1000}
						unfilledColor="#333333"
						height={5}
						drain={true}
						onComplete={handleDeny}
					/>
				)}
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	section: {
		marginBottom: 24,
		backgroundColor: '#000000',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.32)',
		padding: 20,
		borderRadius: 16,
	},
	relayContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	permissionsSection: {
		backgroundColor: 'transparent',
	},
	relayText: {
		...textStyles.captionSB,
		justifyContent: 'center',
		marginLeft: 6,
	},
	warningText: {
		...textStyles.bodyS,
		color: 'rgba(255, 255, 255, 0.64)',
		marginTop: 24,
	},
	permissionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	pathContainer: {
		flex: 2,
		marginLeft: 5,
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	pathText: {
		...textStyles.captionSB,
		// backgroundColor: 'transparent',
	},
	permissionsContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
		backgroundColor: 'transparent',
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	sectionTitle: {
		...textStyles.caption,
		marginBottom: 8,
		backgroundColor: 'transparent',
	},
	unauthorizedText: {
		...textStyles.caption,
	},
	authorizedText: {
		...textStyles.caption,
	},
	avatarContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 16,
	},
	spacer: {
		marginBottom: 12,
	},
	footerContainer: {
		marginTop: 'auto',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		backgroundColor: 'transparent',
	},
	progressBarContainer: {
		position: 'absolute',
		bottom: 0,
		width: 143,
		alignSelf: 'center',
		marginBottom: Platform.select({ ios: 8, android: 0 }),
	},
});

export default memo(ConfirmAuth);
