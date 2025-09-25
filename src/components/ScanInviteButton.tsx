import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { AuthorizeButton, QrCode, Text } from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { readFromClipboard } from '../utils/clipboard';
import PubkyRingLogo from '../images/pubky.png';
import { parseInviteCode, showQRScannerGeneric, showToast } from '../utils/helpers.ts';
import { createPubkyWithInviteCode } from '../utils/pubky.ts';
import { useDispatch } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { getStore } from '../utils/store-helpers.ts';
import { ECurrentScreen } from './PubkySetup/NewPubkySetup.tsx';

const ScanInviteButton = memo(() => {
	const isProcessingInvite = useRef(false);
	const dispatch = useDispatch();

	const handleInviteCodeSignup = useCallback(async (inviteCode: string, source: 'scan' | 'clipboard') => {
		try {
			// Create pubky and sign up with invite code automatically
			const createRes = await createPubkyWithInviteCode(inviteCode, dispatch);

			if (createRes.isErr()) {
				showToast({
					type: 'error',
					title: 'Signup Failed',
					description: createRes.error.message,
				});
				return;
			}

			const { pubky } = createRes.value;

			// Get the pubky data from store
			const pubkyData = getPubky(getStore(), pubky);

			// Show new pubky setup sheet on welcome screen with completed setup
			// TODO: We may just want to tear out the Welcome action sheet and make it standalone for this instance.
			setTimeout(() => {
				SheetManager.show('new-pubky-setup', {
					payload: {
						pubky,
						data: pubkyData,
						currentScreen: ECurrentScreen.welcome,
					},
					onClose: () => {
						SheetManager.hide('new-pubky-setup');
					},
				});
			}, 150);
		} catch (error) {
			console.error('Error handling invite code from', source, ':', error);
			showToast({
				type: 'error',
				title: 'Error',
				description: 'Failed to process invite code',
			});
		}
	}, [dispatch]);

	const handleInviteScan = useCallback(async () => {
		if (isProcessingInvite.current) return;
		await showQRScannerGeneric({
			title: 'Invite',
			onScan: async (data: string) => {
				if (isProcessingInvite.current) return '';
				isProcessingInvite.current = true;

				await SheetManager.hide('camera');

				const inviteCode = parseInviteCode(data);
				if (inviteCode) {
					await handleInviteCodeSignup(inviteCode, 'scan');
				} else {
					showToast({
						type: 'error',
						title: 'Invalid Invite Code',
						description: 'Please scan a valid invite code QR',
					});
				}

				isProcessingInvite.current = false;
				return '';
			},
			onClipboard: async (): Promise<string> => {
				if (isProcessingInvite.current) return '';
				isProcessingInvite.current = true;

				await SheetManager.hide('camera');

				try {
					const clipboardContent = await readFromClipboard();
					const inviteCode = parseInviteCode(clipboardContent);

					if (inviteCode) {
						await handleInviteCodeSignup(inviteCode, 'clipboard');
					} else {
						showToast({
							type: 'error',
							title: 'Invalid Link',
							description: 'Clipboard does not contain a valid invite link',
						});
					}
				} catch (error) {
					showToast({
						type: 'error',
						title: 'Error',
						description: 'Failed to read clipboard',
					});
				}

				isProcessingInvite.current = false;
				return '';
			},
			onComplete: () => {
				SheetManager.hide('camera');
				isProcessingInvite.current = false;
			},
		});
	}, [handleInviteCodeSignup]);

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
