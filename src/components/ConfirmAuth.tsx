import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import { SheetManager } from 'react-native-actions-sheet';
import { performAuth } from '../utils/pubky';
import { useDispatch, useSelector } from 'react-redux';
import { showToast, sleep } from '../utils/helpers.ts';
import PubkyCard from './PubkyCard.tsx';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSequence,
} from 'react-native-reanimated';
import { copyToClipboard } from '../utils/clipboard.ts';
import { BodySText, CaptionSBText, CaptionText } from '../theme/typography';
import { RootState } from '../store';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import ProgressBar from './ProgressBar.tsx';
import { useTranslation } from 'react-i18next';
import { XCallbackParams } from '../utils/inputParser.ts';
import { openXSuccess, openXError, openXCancel } from '../utils/xCallback.ts';
import Button from './Button.tsx';
import Sheet from './Sheet.tsx';
import SafeAreaInset from './SafeAreaInset.tsx';
import { CheckCircle, Folder } from '../icons/index.ts';
import CircularProgressBar from './CircularProgressBar.tsx';

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

const Permission = memo(
	({ capability, isAuthorized }: { capability: Capability; isAuthorized: boolean }): ReactElement => {
		const { t } = useTranslation();
		const hasReadPermission = capability.permission.includes('r');
		const hasWritePermission = capability.permission.includes('w');
		return (
			<View style={styles.permissionRow}>
				<Folder size={16} />
				<View style={styles.pathContainer}>
					<CaptionSBText>{capability.path}</CaptionSBText>
				</View>
				<View style={styles.permissionsContainer}>
					{hasReadPermission && (
						<CaptionText>
							{t('common.read')}
							{hasWritePermission ? ',' : ''}
						</CaptionText>
					)}
					{hasWritePermission && <CaptionText>{t('common.write')}</CaptionText>}
				</View>
			</View>
		);
	},
);

const FADE_DURATION = 100;
const CONFIRM_AUTH_TIMEOUT_MS = 60000;

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

	const headerProgress =
		Platform.OS === 'android' && !isAuthorized ? (
			<CircularProgressBar
				duration={CONFIRM_AUTH_TIMEOUT_MS}
				size={20}
				drain={true}
				onComplete={handleDeny}
			/>
		) : undefined;

	return (
		<Sheet id="confirm-auth" title={titleText} showBottomSafeAreaInset={false} headerRight={headerProgress}>
			<View style={styles.section}>
				<CaptionText
					style={styles.sectionTitle}
					testID={isAuthorized ? 'ConfirmAuthGrantedPermissions' : 'ConfirmAuthRequestedPermissions'}
				>
					{isAuthorized ? t('auth.grantedPermissions') : t('auth.requestedPermissions')}
				</CaptionText>

				<View style={styles.permissions}>
					{authDetailCapabilities.map((capability, index) => (
						<Permission key={index} capability={capability} isAuthorized={isAuthorized} />
					))}
				</View>
			</View>

			<PubkyCard name={pubkyName} publicKey={pubky} />

			{!isAuthorized && (
				<BodySText style={styles.warningText} colorName="textTertiary">
					{t('auth.trustWarning')}
				</BodySText>
			)}

			<View style={styles.imageContainer}>
				<Animated.View style={[styles.imageWrapper, checkStyle]}>
					<CheckCircle colorName="pubkyApp" size={128} />
				</Animated.View>
			</View>

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

				<SafeAreaInset edge="bottom" />

				{Platform.OS === 'ios' && !isAuthorized && (
					<ProgressBar
						style={styles.progressBarContainer}
						duration={CONFIRM_AUTH_TIMEOUT_MS}
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
		marginTop: 24,
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
		marginTop: 'auto',
		justifyContent: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	progressBarContainer: {
		position: 'absolute',
		bottom: 8,
		width: 143,
		alignSelf: 'center',
	},
});

export default memo(ConfirmAuth);
