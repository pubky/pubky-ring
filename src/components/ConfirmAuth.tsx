import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import {
	ActionButton,
	ActionSheetContainer,
	AnimatedView,
	Folder,
	SessionText,
	Text,
	View,
	SkiaGradient,
} from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { performAuth } from '../utils/pubky';
import { useDispatch, useSelector } from 'react-redux';
import {
	getToastStyle,
	isSmallScreen,
	showToast,
} from '../utils/helpers.ts';
import PubkyCard from './PubkyCard.tsx';
import { useAnimatedStyle, useSharedValue, withTiming, withSequence } from 'react-native-reanimated';
import { copyToClipboard } from '../utils/clipboard.ts';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../theme/toastConfig.tsx';
import ModalIndicator from './ModalIndicator.tsx';
import { Globe } from 'lucide-react-native';
import {
	ACTION_SHEET_HEIGHT,
	SMALL_SCREEN_ACTION_SHEET_HEIGHT,
} from '../utils/constants.ts';
import { buttonStyles } from '../theme/utils';
import { RootState } from '../store';
import { getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { CircleCheck } from 'lucide-react-native';
import ProgressBar from './ProgressBar.tsx';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useTranslation } from 'react-i18next';

interface ConfirmAuthProps {
    pubky: string;
    authUrl: string;
    authDetails: PubkyAuthDetails;
    onComplete: () => void;
}

interface Capability {
    path: string;
    permission: string;
}

const toastStyle = getToastStyle();

const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

const CapabilitiesList = memo(({ capabilities, isAuthorized }: { capabilities: Capability[]; isAuthorized: boolean }): ReactElement => {
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
});

const Permission = memo(({ capability, isAuthorized }: { capability: Capability; isAuthorized: boolean }): ReactElement => {
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
					<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>{t('common.read')}{hasWritePermission ? ',' : ''}</SessionText>
				)}
				{hasWritePermission && (
					<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>{t('common.write')}</SessionText>
				)}
			</View>
		</View>
	);
});

const FADE_DURATION = 100;
const ConfirmAuth = ({ payload }: { payload: ConfirmAuthProps }): ReactElement => {
	const { t } = useTranslation();
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { pubky, authUrl, authDetails, onComplete } = payload;
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
				withTiming(1, { duration: 300,				})
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
				return;
			}
			setIsAuthorized(true);
			SystemNavigationBar.navigationShow();
			onComplete?.();
		} catch (e: unknown) {
			const error = e as Error;
			const errorMsg = error.message === 'Authentication request timed out'
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
		} finally {
			setAuthorizing(false);
		}
	}, [authUrl, dispatch, onComplete, pubky, t]);

	const authDetailCapabilities = useMemo(() => {
		return authDetails?.capabilities ?? [];
	}, [authDetails?.capabilities]);

	return (
		<ActionSheetContainer
			id="confirm-auth"
			navigationAnimation={navigationAnimation}
			CustomHeaderComponent={<></>}
			height={actionSheetHeight}
		>
			<SkiaGradient modal={true} style={styles.content}>
				<ModalIndicator />
				<View style={styles.mainContent}>
					<View style={styles.titleContainer}>
						<Text style={styles.title}>
							{isAuthorized ? t('auth.authorizationSuccessful') : t('auth.authorize')}
						</Text>
					</View>

					<PubkyCard
						name={pubkyName}
						publicKey={pubky}
						style={styles.pubkyCard}
						containerStyle={styles.pubkyContainer}
						nameStyle={styles.pubkyName}
						pubkyTextStyle={styles.pubkyText}
						avatarSize={48}
						avatarStyle={styles.avatarContainer}
					/>

					<View style={styles.section}>
						<SessionText style={styles.sectionTitle}>{t('auth.relay')}</SessionText>
						<View style={styles.relayContainer}>
							<Globe color="rgba(255, 255, 255, 0.8)" size={15} />
							<Text style={styles.relayText}>{authDetails.relay}</Text>
						</View>
					</View>

					<View style={styles.section}>
						<SessionText style={styles.sectionTitle}>{isAuthorized ? t('auth.grantedPermissions') : t('auth.requestedPermissions')}</SessionText>
						<CapabilitiesList capabilities={authDetailCapabilities} isAuthorized={isAuthorized} />
					</View>

					{!isAuthorized && (<SessionText style={styles.warningText}>
						{t('auth.trustWarning')}
					</SessionText>)}

					<View style={styles.imageContainer}>
						<AnimatedView style={[styles.imageWrapper, checkStyle]}>
							<CircleCheck color="rgba(200, 255, 0, 1)" size={52} />
						</AnimatedView>
					</View>
				</View>

				<View style={styles.footerContainer}>
					<View style={styles.buttonContainer}>
						{!isAuthorized ? (
							<>
								<ActionButton
                            		style={styles.denyButton}
                            		onPressIn={handleClose}
                            		activeOpacity={0.7}
                            	>
									<Text numberOfLines={1} style={styles.actionButtonText}>{authorizing ? t('common.close') : t('auth.deny')}</Text>
								</ActionButton>

								<ActionButton
                            		style={[styles.authorizeButton, authorizing && styles.buttonDisabled]}
                            		onPressIn={handleAuth}
                            		disabled={authorizing}
                            		activeOpacity={0.7}
                            	>
									<Text numberOfLines={1} style={styles.actionButtonText}>{authorizing ? t('auth.authorizing') : t('auth.authorize')}</Text>
								</ActionButton>
							</>
                        ) : (
	<ActionButton style={styles.okButton} onPressIn={handleClose}>
		<Text style={styles.buttonText}>{t('common.ok')}</Text>
	</ActionButton>
                        )}
					</View>
					<View style={styles.progressBarContainer}>
						{!isAuthorized ? (
							<ProgressBar
                            	duration={20000}
                            	//fadeIn={true}
                            	//fadeInDuration={1000}
                            	delayRender={0}
                            	unfilledColor="#333333"
                            	filledColor="#FFFFFF"
                            	height={6}
                            	borderRadius={3}
                            	onComplete={handleClose}
							/>) : null}
					</View>
				</View>
			</SkiaGradient>
			<Toast config={toastConfig({ style: toastStyle })} />
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		height: '100%',
		backgroundColor: 'transparent',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
		letterSpacing: 0.2,
		alignSelf: 'center',
	},
	section: {
		marginBottom: 24,
		backgroundColor: 'rgba(0, 0, 0, 0)',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.16)',
		padding: 20,
		borderRadius: 16,
	},
	relayContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		backgroundColor: 'transparent'
	},
	permissionsSection: {
		backgroundColor: 'transparent',
	},
	relayText: {
		fontSize: 13,
		fontWeight: '600',
		lineHeight: 18,
		letterSpacing: 0.4,
		justifyContent: 'center',
		marginLeft: 6,
	},
	warningText: {
		fontWeight: '400',
		fontSize: 15,
		lineHeight: 20,
		letterSpacing: 0.4,
		marginBottom: 8,
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
		fontSize: 13,
		fontWeight: '600',
		lineHeight: 18,
		backgroundColor: 'transparent',
	},
	permissionsContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
		backgroundColor: 'transparent',
	},
	footerContainer: {
		height: '15%',
		paddingHorizontal: 12,
		justifyContent: 'center',
		backgroundColor: 'transparent',
		//paddingBottom: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 12,
		zIndex: 3,
		backgroundColor: 'transparent',
	},
	mainContent: {
		height: '80%',
		paddingHorizontal: 12,
		backgroundColor: 'transparent',
	},
	imageContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 150,
		width: '100%',
		position: 'relative',
		backgroundColor: 'transparent',
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	denyButton: {
		...buttonStyles.compactOutline,
		width: '45%',
		margin: 8,
		justifyContent: 'center',
		borderWidth: 0,
	},
	authorizeButton: {
		...buttonStyles.compactOutline,
		width: '45%',
		margin: 8,
		justifyContent: 'center',
	},
	okButton: {
		...buttonStyles.compactOutline,
		width: '100%',
		margin: 8,
		justifyContent: 'center',
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		fontWeight: '600',
		fontSize: 15,
		lineHeight: 18,
		textAlign: 'center',
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		marginBottom: 8,
		backgroundColor: 'transparent',
	},
	unauthorizedText: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		backgroundColor: 'transparent',
	},
	authorizedText: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
		backgroundColor: 'transparent',
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		backgroundColor: 'transparent',
	},
	pubkyCard: {
		minHeight: 100,
	},
	pubkyContainer: {
		//paddingHorizontal: 20,
	},
	avatarContainer: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 16,
	},
	pubkyName: {
		fontSize: 26,
		fontWeight: '300',
		lineHeight: 32,
		letterSpacing: 0,
		marginBottom: 2,
	},
	pubkyText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 20,
		letterSpacing: 0.4,
	},
	spacer: {
		marginBottom: 12,
	},
	progressBarContainer: {
		width: 200,
		alignSelf: 'center',
		marginTop: 10,
		marginBottom: smallScreen ? 20 : 0,
	},
});

export default memo(ConfirmAuth);
