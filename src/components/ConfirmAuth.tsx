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
	ForegroundTouchableOpacity,
} from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { getPubkySecretKey, signInToHomeserver } from '../utils/pubky';
import { Pubky } from '../types/pubky.ts';
import { useDispatch } from 'react-redux';
import { Check } from 'lucide-react-native';

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

const ConfirmAuth = memo(({ payload }: { payload: ConfirmAuthProps }): ReactElement => {
	const { pubky, pubkyData, authUrl, authDetails, onComplete } = payload;
	const [authorizing, setAuthorizing] = useState(false);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const dispatch = useDispatch();

	const handleAuth = useCallback(async () => {
		try {
			setAuthorizing(true);
			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				Alert.alert('Error', 'Failed to get secret key');
				setAuthorizing(false);
				return;
			}

			const signInRes = await signInToHomeserver(pubky, pubkyData?.homeserver, dispatch);
			if (signInRes.isErr()) {
				console.error('Error signing in:', signInRes.error);
				Alert.alert('Error', signInRes?.error?.message ?? 'Failed to sign in');
				return;
			}

			const authRes = await auth(authUrl, secretKeyRes.value);
			if (authRes.isErr()) {
				console.error('Error processing auth:', authRes.error);
				Alert.alert('Error', authRes?.error?.message ?? 'Failed to process QR code data');
				setAuthorizing(false);
				return;
			}

			//Alert.alert('Success', `Auth for ${pubky} was successful`);
			setIsAuthorized(true); // Set authorization success
			onComplete?.();
		} catch (error) {
			Alert.alert('Error', 'An error occurred during authorization');
			console.error('Auth error:', error);
		} finally {
			setAuthorizing(false);
		}
	}, [authUrl, dispatch, onComplete, pubky, pubkyData?.homeserver]);

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
							<ForegroundTouchableOpacity
            		style={styles.button}
            		onPress={handleClose}
            		disabled={authorizing}
            	>
								<Text style={styles.buttonText}>{authorizing ? 'Close' : 'Deny'}</Text>
							</ForegroundTouchableOpacity>
							<ForegroundTouchableOpacity
            		style={[styles.button, styles.authorizeButton, authorizing && styles.buttonDisabled]}
            		onPress={handleAuth}
            		disabled={authorizing}
            	>
								<Text style={[styles.buttonText, styles.authorizeButtonText]}>
									{authorizing ? 'Authorizing...' : 'Authorize'}
								</Text>
							</ForegroundTouchableOpacity>
						</>
          ) : (
	<TouchableOpacity style={[styles.button, styles.doneButton]} onPress={handleClose}>
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
	indicator: {
		width: 40,
		height: 4,
		backgroundColor: '#ccc',
		borderRadius: 2,
		marginTop: 8,
		marginBottom: 8,
	},
	content: {
		padding: 24,
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
		justifyContent: 'flex-end',
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
