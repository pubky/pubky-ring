import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Image, StyleSheet } from 'react-native';
import { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import { ActionButton, ActionSheetContainer, AnimatedView, Folder, SessionText, Text, View } from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { performAuth } from '../utils/pubky';
import { useDispatch, useSelector } from 'react-redux';
import { showToast } from '../utils/helpers.ts';
import PubkyCard from './PubkyCard.tsx';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { copyToClipboard } from '../utils/clipboard.ts';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';

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

const { height } = Dimensions.get('window');

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
	}, [authUrl, dispatch, onComplete, pubky]);

	const handleClose = useCallback(() => {
		SheetManager.hide('confirm-auth');
	}, []);

	const showImage = useMemo(() => {
		return height >= 700;
	}, []);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="confirm-auth"
				onClose={handleClose}
				navigationAnimation={navigationAnimation}>
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

					{showImage && (
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
				</View>
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
		height: 150,
		width: '100%',
		position: 'relative',
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
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
