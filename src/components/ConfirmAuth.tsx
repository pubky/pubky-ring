import React, { JSX, memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Image, Linking, Platform, StyleSheet } from 'react-native';
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
	RadialGradient,
} from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { performAuth } from '../utils/pubky';
import { useDispatch, useSelector } from 'react-redux';
import { showToast, sleep } from '../utils/helpers.ts';
import PubkyCard from './PubkyCard.tsx';
import { useAnimatedStyle, useSharedValue, withSpring, withTiming, withSequence } from 'react-native-reanimated';
import { copyToClipboard } from '../utils/clipboard.ts';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../theme/toastConfig.tsx';
import ModalIndicator from './ModalIndicator.tsx';
import { AUTHORIZE_KEY_GRADIENT, PUBKY_APP_URL } from '../utils/constants.ts';

interface ConfirmAuthProps {
	pubky: string;
	authUrl: string;
	authDetails: PubkyAuthDetails;
	onComplete: () => void;
	deepLink?: boolean;
}

interface Capability {
	path: string;
	permission: string;
}

const { height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const toastStyle = {
	top: Platform.select({
		ios: isSmallScreen ? -9 : -50,
		android: isSmallScreen ? -9 : -50,
	}),
};

const CapabilitiesList = memo(({ capabilities, isAuthorized }: { capabilities: Capability[]; isAuthorized: boolean }): ReactElement => {
	return (
		<>
			{capabilities.map((capability, index) => (
				<Permission key={index} capability={capability} isAuthorized={isAuthorized} />
			))}
		</>
	);
});

const Permission = memo(({ capability, isAuthorized }: { capability: Capability; isAuthorized: boolean }): ReactElement => {
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
					<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>Read{hasWritePermission ? ',' : ''}</SessionText>
				)}
				{hasWritePermission && (
					<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>Write</SessionText>
				)}
			</View>
		</View>
	);
});

const FADE_DURATION = 200;
const ConfirmAuth = memo(({ payload }: { payload: ConfirmAuthProps }): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { pubky, authUrl, authDetails, onComplete } = payload;
	const deepLink = payload?.deepLink;
	const [authorizing, setAuthorizing] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const dispatch = useDispatch();

	const checkOpacity = useSharedValue(0);
	const checkScale = useSharedValue(0.2); // Start very small

	const checkStyle = useAnimatedStyle(() => ({
		opacity: checkOpacity.value,
		transform: [{ scale: checkScale.value }],
		position: 'absolute',
	}));

	useEffect(() => {
		if (authorizing) {
			checkOpacity.value = withTiming(0, { duration: FADE_DURATION });
			checkScale.value = withTiming(0.2);
		} else if (isAuthorized) {
			checkOpacity.value = withTiming(1, { duration: FADE_DURATION });
			checkScale.value = withSequence(
				// Start small
				withTiming(0.2, { duration: 0 }),
				// Overshoot slightly with spring
				withSpring(1.2, {
					damping: 12,
					stiffness: 100,
				}),
				// Settle back to normal size with spring
				withSpring(1, {
					damping: 15,
					stiffness: 100,
				})
			);
		} else {
			checkOpacity.value = withTiming(0, { duration: FADE_DURATION });
			checkScale.value = withTiming(0.2);
		}
	}, [authorizing, checkOpacity, checkScale, isAuthorized]);

	const handleClose = useCallback(() => {
		SheetManager.hide('confirm-auth');
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
					title: 'Error',
					description: res.error.message,
				});
				return;
			}
			setIsAuthorized(true);
			onComplete?.();
			if (deepLink) {
				setAuthorizing(false);
				// Give a partial glimpse of the success animation and some time for the site to detect us as logged in.
				await sleep(FADE_DURATION + 300);
				handleClose();
				Linking.openURL(PUBKY_APP_URL);
			}
		} catch (e: unknown) {
			const error = e as Error;
			const errorMsg = error.message === 'Authentication request timed out'
				? 'The authentication process took too long. Please try again.'
				: error.message || 'An error occurred during authorization';
			showToast({
				type: 'error',
				title: 'Error',
				description: errorMsg,
				autoHide: true,
				visibilityTime: 20000,
				onPress: () => {
					copyToClipboard(errorMsg);
					Alert.alert('Error copied to clipboard', errorMsg);
				},
			});
			console.error('Auth error:', error);
		} finally {
			setAuthorizing(false);
		}
	}, [authUrl, deepLink, dispatch, handleClose, onComplete, pubky]);

	// eslint-disable-next-line react/no-unused-prop-types
	const GradientView = useCallback(({ children }: { children: React.ReactNode }): JSX.Element => {
		if (isAuthorized)  {
			return (
				<RadialGradient
					style={styles.content}
					colors={AUTHORIZE_KEY_GRADIENT}
					center={{ x: 0.5, y: 0.5 }}
				>
					{children}
				</RadialGradient>
			);
		} else {
			return (
				<SkiaGradient modal={true} style={styles.content}>
					{children}
				</SkiaGradient>
			);
		}
	}, [isAuthorized]);

	const authDetailCapabilities = useMemo(() => {
		return authDetails?.capabilities ?? [];
	}, [authDetails?.capabilities]);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="confirm-auth"
				navigationAnimation={navigationAnimation}
				CustomHeaderComponent={<></>}>
				<GradientView>
					<ModalIndicator />
					<View style={styles.titleContainer}>
						<Text style={styles.title}>
							{isAuthorized ? 'Authorized' : 'Authorize'}
						</Text>
					</View>

					<View style={styles.section}>
						<SessionText style={styles.warningText}>
							{isAuthorized ? 'Successfully granted permission to manage your data.' : 'Make sure you trust this service, browser, or device before granting permission to manage your data.'}
						</SessionText>
					</View>

					<View style={styles.section}>
						<SessionText style={styles.sectionTitle}>Relay</SessionText>
						<Text style={styles.relayText}>{authDetails.relay}</Text>
					</View>

					<View style={styles.permissionsSection}>
						<SessionText style={styles.sectionTitle}>{isAuthorized ? 'Granted Permissions' : 'Requested Permissions'}</SessionText>
						<CapabilitiesList capabilities={authDetailCapabilities} isAuthorized={isAuthorized} />
					</View>

					{!isSmallScreen && (
						<View style={styles.imageContainer}>
							<AnimatedView style={[styles.imageWrapper, checkStyle]}>
								<Image
									source={require('../images/check.png')}
									style={styles.keyImage}
								/>
							</AnimatedView>
						</View>
					)}

					<View style={styles.footerContainer}>
						<SessionText style={styles.sectionTitle}>{isAuthorized ? 'Authorized with Pubky' : 'Authorize With Pubky'}</SessionText>
						<PubkyCard publicKey={pubky} />
						<View style={styles.buttonContainer}>
							{!isAuthorized ? (
								<>
									<ActionButton
										style={styles.denyButton}
										onPressIn={handleClose}
										activeOpacity={0.7}
									>
										<Text style={styles.actionButtonText}>{authorizing ? 'Close' : 'Deny'}</Text>
									</ActionButton>

									<ActionButton
										style={[styles.authorizeButton, authorizing && styles.buttonDisabled]}
										onPressIn={handleAuth}
										disabled={authorizing}
										activeOpacity={0.7}
									>
										<Text style={styles.actionButtonText}>{authorizing ? 'Authorizing...' : 'Authorize'}</Text>
									</ActionButton>
								</>
							) : (
								<ActionButton style={styles.okButton} onPressIn={handleClose}>
									<Text style={styles.buttonText}>OK</Text>
								</ActionButton>
							)}
						</View>
					</View>
				</GradientView>
				<Toast config={toastConfig({ style: toastStyle })} />
			</ActionSheetContainer>
		</View>
	);
});

const styles = StyleSheet.create({
	// TODO: Eventially remove the absolute positioned container View.
	// It only exists because the ActionSheetContainer does not work well with the DraggableFlatList component.
	container: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	content: {
		paddingHorizontal: 12,
		backgroundColor: 'transparent',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	actionButton: {
		width: '45%',
		height: 48,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		margin: 8,
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		alignSelf: 'center',
	},
	section: {
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	permissionsSection: {
		marginBottom: 10,
		backgroundColor: 'transparent',
	},
	relayText: {
		fontSize: 16,
		marginBottom: 8,
	},
	warningText: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		marginBottom: 8,
	},
	permissionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
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
	permissionChip: {
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
		backgroundColor: '#f0f0f0',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		gap: 12,
		zIndex: 3,
		backgroundColor: 'transparent',
		paddingBottom: 20,
	},
	footerContainer: {
		marginBottom: 10,
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
	keyImage: {
		width: 150,
		height: 150,
		resizeMode: 'contain',
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		minWidth: 100,
	},
	denyButton: {
		width: '45%',
		height: 58,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		margin: 8,
		justifyContent: 'center',
	},
	authorizeButton: {
		width: '45%',
		height: 58,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		margin: 8,
		borderWidth: 1,
		justifyContent: 'center',
	},
	okButton: {
		width: '100%',
		height: 58,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		margin: 8,
		borderWidth: 1,
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
	authorizeButtonText: {
		color: 'white',
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		textTransform: 'uppercase',
		marginBottom: 8,
		backgroundColor: 'transparent',
	},
	unauthorizedText: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		textTransform: 'uppercase',
		backgroundColor: 'transparent',
	},
	authorizedText: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
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
		fontSize: 24,
		fontWeight: '600',
		backgroundColor: 'transparent',
	},
	checkmarkContainer: {
		marginLeft: 8,
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
});

export default memo(ConfirmAuth);
