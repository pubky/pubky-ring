import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { AuthorizeButton, QrCode, Text } from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { readFromClipboard } from '../utils/clipboard';
import Toast from 'react-native-toast-message';
import PubkyRingLogo from '../images/pubky.png';
import { parseInviteCode } from '../utils/helpers.ts';

const ScanInviteButton = memo(() => {
	const isProcessingInvite = useRef(false);

	const handleInviteScan = useCallback(async () => {
		if (isProcessingInvite.current) return;

		SheetManager.show('camera', {
			payload: {
				onScan: async (data: string) => {
					if (isProcessingInvite.current) return;
					isProcessingInvite.current = true;

					await SheetManager.hide('camera');

					const inviteCode = parseInviteCode(data);
					if (inviteCode) {
						Toast.show({
							type: 'success',
							text1: 'Invite Code Detected',
							text2: `Code: ${inviteCode}`,
							visibilityTime: 3000,
						});
						// TODO: Process the invite code here
						console.log('Invite code found:', inviteCode);
					} else {
						Toast.show({
							type: 'error',
							text1: 'Invalid QR Code',
							text2: 'Please scan a valid invite QR code',
							visibilityTime: 3000,
						});
					}

					isProcessingInvite.current = false;
					return '';
				},
				onCopyClipboard: async (): Promise<string> => {
					if (isProcessingInvite.current) return '';
					isProcessingInvite.current = true;

					await SheetManager.hide('camera');

					try {
						const clipboardContent = await readFromClipboard();
						const inviteCode = parseInviteCode(clipboardContent);

						if (inviteCode) {
							Toast.show({
								type: 'success',
								text1: 'Invite Code Pasted',
								text2: `Code: ${inviteCode}`,
								visibilityTime: 3000,
							});
							// TODO: Process the invite code here
							console.log('Invite code from clipboard:', inviteCode);
						} else {
							Toast.show({
								type: 'error',
								text1: 'Invalid Link',
								text2: 'Clipboard does not contain a valid invite link',
								visibilityTime: 3000,
							});
						}
					} catch (error) {
						Toast.show({
							type: 'error',
							text1: 'Error',
							text2: 'Failed to read clipboard',
							visibilityTime: 3000,
						});
					}

					isProcessingInvite.current = false;
					return '';
				},
				onClose: () => {
					SheetManager.hide('camera');
					isProcessingInvite.current = false;
				},
			},
		});
	}, []);

	return (
		<View style={styles.container}>
			<AuthorizeButton
				style={styles.button}
				onPressIn={handleInviteScan}
			>
				<View style={styles.row}>
					<QrCode size={19} />
					<Text style={styles.text}>Scan invite for</Text>
					<Image
						source={PubkyRingLogo}
						style={styles.logo}
					/>
				</View>
			</AuthorizeButton>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 0,
		justifyContent: 'flex-end'
	},
	button: {
		width: '90%',
		borderRadius: 64,
		minHeight: 64,
		alignItems: 'center',
		display: 'flex',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		flexDirection: 'row',
		gap: 4,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	text: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
		paddingHorizontal: 6,
	},
	logo: {
		height: 56,
		resizeMode: 'contain',
		backgroundColor: 'transparent',
	},
});

export default ScanInviteButton;
