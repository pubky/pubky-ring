import React, {
	memo, ReactElement, useCallback, useState, useEffect,
} from 'react';
import { Alert, Image, StyleSheet } from 'react-native';
import { PubkyAuthDetails, auth } from '@synonymdev/react-native-pubky';
import {
	ActionSheetContainer,
	Text,
	SessionText,
	View,
	ActionButton,
	Folder,
	AnimatedView,
} from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { getPubkySecretKey, signUpToHomeserver } from '../utils/pubky';
import { Pubky } from '../types/pubky.ts';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux';
import { showToast } from '../utils/helpers.ts';
import PubkyCard from './PubkyCard.tsx';
import {
	withTiming,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import { copyToClipboard } from '../utils/clipboard.ts';

interface ConfirmAuthProps {
	pubky: string;
	pubkyData: Pubky;
	authUrl: string;
	authDetails: PubkyAuthDetails;
	onComplete: () => void;
}

interface Capability {
	path: string;
	permission: string;
}

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

const TIMEOUT_MS = 20000;
const FADE_DURATION = 200;
const timeout = (ms: number): Promise<void> =>
	new Promise((_, reject): void => {setTimeout(() => reject(new Error('Authentication request timed out')), ms);});

const performAuth = async ({
	pubky,
	pubkyData,
	homeserver,
	authUrl,
	dispatch,
}: {
	pubky: string;
	pubkyData: Pubky;
	homeserver: string;
	authUrl: string;
	dispatch: Dispatch;
}): Promise<void> => {
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) {
		throw new Error('Failed to get secret key');
	}
	if (!pubkyData.signedUp) {
		const signUpRes = await signUpToHomeserver({
			pubky,
			secretKey: secretKeyRes.value,
			homeserver,
			dispatch,
		});
		if (signUpRes.isErr()) {
			console.error('Error signing up:', signUpRes.error);
			throw new Error(signUpRes.error.message || 'Failed to sign up');
		}
	}

	const authRes = await auth(authUrl, secretKeyRes.value);
	if (authRes.isErr()) {
		console.error('Error processing auth:', authRes.error);
		throw new Error(authRes.error.message || 'Failed to process QR code data');
	}
};

const ConfirmAuth = memo(({ payload }: { payload: ConfirmAuthProps }): ReactElement => {
	const { pubky, pubkyData, authUrl, authDetails, onComplete } = payload;
	const [authorizing, setAuthorizing] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const dispatch = useDispatch();

	const checkOpacity = useSharedValue(0);

	const checkStyle = useAnimatedStyle(() => ({
		opacity: checkOpacity.value,
		position: 'absolute',
	}));

	useEffect(() => {
		if (authorizing) {
			checkOpacity.value = withTiming(0, { duration: FADE_DURATION });
		} else if (isAuthorized) {
			checkOpacity.value = withTiming(1, { duration: FADE_DURATION });
		} else {
			checkOpacity.value = withTiming(0, { duration: FADE_DURATION });
		}
	}, [authorizing, checkOpacity, isAuthorized]);

	const handleAuth = useCallback(async () => {
		setAuthorizing(true);
		try {
			await Promise.race([
				performAuth({
					pubky,
					pubkyData,
					homeserver: pubkyData?.homeserver,
					authUrl,
					dispatch,
				}),
				timeout(TIMEOUT_MS),
			]);

			setIsAuthorized(true);
			onComplete?.();
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
	}, [authUrl, dispatch, onComplete, pubky, pubkyData]);

	const handleClose = useCallback(() => {
		SheetManager.hide('confirm-auth');
	}, []);

	return (
		<ActionSheetContainer
			id="confirm-auth"
			containerStyle={styles.container}
			gestureEnabled
			indicatorStyle={styles.indicator}
			defaultOverlayOpacity={0.3}
			statusBarTranslucent
			drawUnderStatusBar={false}>
			<View style={styles.content}>
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
					{authDetails.capabilities.map((capability, index) => (
						<Permission key={index} capability={capability} isAuthorized={isAuthorized} />
					))}
				</View>

				<View style={styles.imageContainer}>
					<AnimatedView style={[styles.imageWrapper, checkStyle]}>
						<Image
							source={require('../images/check.png')}
							style={styles.keyImage}
						/>
					</AnimatedView>
				</View>

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
			</View>
		</ActionSheetContainer>
	);
});

const styles = StyleSheet.create({
	container: {
	},
	content: {
		paddingHorizontal: 12,
		paddingTop: 20,
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
	indicator: {
		width: 32,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginVertical: 12,
	},
	section: {
		marginBottom: 24,
	},
	permissionsSection: {
		marginBottom: 10,
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
	},
	pathContainer: {
		flex: 2,
		marginLeft: 5,
		justifyContent: 'center',
	},
	pathText: {
		fontSize: 13,
		fontWeight: '600',
		lineHeight: 18,
	},
	permissionsContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
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
	},
	footerContainer: {
		marginBottom: 10,
	},
	imageContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 200,
		width: '100%',
		position: 'relative',
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	keyImage: {
		width: 200,
		height: 200,
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
	unauthorizedChip: {
		backgroundColor: '#ffebee',
	},
	authorizedChip: {
		backgroundColor: '#e8f5e9',
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		textTransform: 'uppercase',
		marginBottom: 8,
	},
	unauthorizedText: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		textTransform: 'uppercase',
	},
	authorizedText: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		textTransform: 'uppercase',
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
		zIndex: 3,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
	},
	checkmarkContainer: {
		marginLeft: 8,
		justifyContent: 'center',
	},
});

export default memo(ConfirmAuth);
