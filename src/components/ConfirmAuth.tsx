import React, {
	memo, ReactElement, useCallback, useState,
} from 'react';
import { StyleSheet, Alert } from 'react-native';
import { PubkyAuthDetails, auth } from '@synonymdev/react-native-pubky';
import {
	ActionSheetContainer,
	Text,
	SessionText,
	TouchableOpacity,
	View,
	ActionButton,
} from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { getPubkySecretKey, signUpToHomeserver } from '../utils/pubky';
import { Pubky } from '../types/pubky.ts';
import { useDispatch } from 'react-redux';
import { Check } from 'lucide-react-native';
import { Dispatch } from 'redux';

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
	return (
		<View style={styles.permissionRow}>
			<View style={styles.pathContainer}>
				<SessionText style={styles.pathText}>{capability.path}</SessionText>
			</View>
			<View style={styles.permissionsContainer}>
				{capability.permission.includes('r') && (
					<View style={[styles.permissionChip, isAuthorized ? styles.authorizedChip : styles.unauthorizedChip]}>
						<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>Read</SessionText>
					</View>
				)}
				{capability.permission.includes('w') && (
					<View style={[styles.permissionChip, isAuthorized ? styles.authorizedChip : styles.unauthorizedChip]}>
						<SessionText style={isAuthorized ? styles.authorizedText : styles.unauthorizedText}>Write</SessionText>
					</View>
				)}
			</View>
		</View>
	);
});

const TIMEOUT_MS = 20000; // 20-second timeout
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
			Alert.alert(
				'Error',
				error.message === 'Authentication request timed out'
					? 'The authentication process took too long. Please try again.'
					: error.message || 'An error occurred during authorization'
			);
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
			gestureEnabled={true}
			indicatorStyle={styles.indicator}
			//onClose={handleClose}
			defaultOverlayOpacity={0.3}
			statusBarTranslucent
			drawUnderStatusBar={false}
		>
			<View style={styles.content}>
				<View style={styles.titleContainer}>
					<Text style={[styles.title, isAuthorized && styles.authorizedTitle]}>
						{isAuthorized ? 'Authorized' : 'Authorize Access'}
					</Text>
					{isAuthorized && (
						<View style={styles.checkmarkContainer}>
							<Check size={24} color="#2e7d32" />
						</View>
					)}
				</View>

				<View style={styles.section}>
					<SessionText style={styles.sectionTitle}>Relay</SessionText>
					<Text style={styles.relayText}>{authDetails.relay}</Text>
				</View>

				<View style={styles.section}>
					<SessionText style={styles.sectionTitle}>Requested Permissions</SessionText>
					{authDetails.capabilities.map((capability, index) => (
						<Permission key={index} capability={capability} isAuthorized={isAuthorized} />
					))}
				</View>

				<View style={styles.buttonContainer}>
					{!isAuthorized ? (
						<>

							<ActionButton
								style={styles.actionButton}
								onPressIn={handleClose}
								activeOpacity={0.7}
							>
								<Text style={styles.actionButtonText}>{authorizing ? 'Close' : 'Deny'}</Text>

							</ActionButton>

							<ActionButton
								style={[styles.actionButton, authorizing && styles.buttonDisabled]}
								onPressIn={handleAuth}
								disabled={authorizing}
								activeOpacity={0.7}
							>
								<Text style={styles.actionButtonText}>{authorizing ? 'Authorizing...' : 'Authorize'}</Text>

							</ActionButton>
						</>
					) : (
						<TouchableOpacity style={[styles.button, styles.doneButton]} onPressIn={handleClose}>
							<Text style={[styles.buttonText, styles.authorizeButtonText]}>Done</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		</ActionSheetContainer>
	);
});

const styles = StyleSheet.create({
	container: {
		height: '50%',
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
	content: {
		paddingHorizontal: 24,
		paddingBottom: 24,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 14,
		textTransform: 'uppercase',
		marginBottom: 8,
	},
	relayText: {
		fontSize: 16,
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
	},
	pathText: {
		fontSize: 14,
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
		marginTop: 'auto',
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		minWidth: 100,
	},
	authorizeButton: {
		backgroundColor: '#0066cc',
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		fontSize: 16,
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
	unauthorizedText: {
		color: '#c62828',
	},
	authorizedText: {
		color: '#2e7d32',
	},
	doneButton: {
		backgroundColor: '#2e7d32',
		flex: 1,
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
	},
	authorizedTitle: {
		color: '#2e7d32',
	},
	checkmarkContainer: {
		marginLeft: 8,
		justifyContent: 'center',
	},
});

export default memo(ConfirmAuth);
