// currently unused

import React, { memo, useCallback, useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Scan } from '../theme/components';
import { SheetManager } from 'react-native-actions-sheet';
import { readFromClipboard } from '../utils/clipboard';
import PubkyRingLogo from '../images/pubky.png';
import { showToast } from '../utils/helpers';
import { useDispatch } from 'react-redux';
import { parseInput, InputAction } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import i18n from '../i18n';
import { textStyles } from '../theme/utils';
import Button from './Button.tsx';

const ScanInviteButton = memo(() => {
	const isProcessingInvite = useRef(false);
	const dispatch = useDispatch();

	/**
	 * Processes input data from scan or clipboard
	 * Uses the unified input parser and router
	 */
	const processInput = useCallback(
		async (data: string, source: 'scan' | 'clipboard'): Promise<void> => {
			// Parse the input using the unified parser
			const parsed = await parseInput(data, source);

			// Only handle signup and invite actions in this button
			if (parsed.action === InputAction.Signup || parsed.action === InputAction.Invite) {
				// Error handling is done via the loading modal error state
				await routeInput(parsed, { dispatch });
			} else {
				// Not a valid invite/signup input
				showToast({
					type: 'error',
					title: i18n.t('scanInvite.invalidInviteCode'),
					description: i18n.t('scanInvite.invalidInviteDescription'),
				});
			}
		},
		[dispatch],
	);

	const handleInviteScan = useCallback(async () => {
		if (isProcessingInvite.current) return;

		await new Promise<void>(resolve => {
			SheetManager.show('camera', {
				payload: {
					title: i18n.t('import.title'),
					onScan: async (data: string) => {
						if (isProcessingInvite.current) {
							resolve();
							return;
						}
						isProcessingInvite.current = true;

						await SheetManager.hide('camera');
						await processInput(data, 'scan');

						isProcessingInvite.current = false;
						resolve();
					},
					onCopyClipboard: async (): Promise<void> => {
						if (isProcessingInvite.current) {
							resolve();
							return;
						}
						isProcessingInvite.current = true;

						await SheetManager.hide('camera');

						try {
							const clipboardContent = await readFromClipboard();
							if (!clipboardContent) {
								showToast({
									type: 'error',
									title: i18n.t('common.error'),
									description: i18n.t('errors.emptyClipboard'),
								});
							} else {
								await processInput(clipboardContent, 'clipboard');
							}
						} catch {
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: i18n.t('scanInvite.failedToReadClipboard'),
							});
						}

						isProcessingInvite.current = false;
						resolve();
					},
					onClose: () => {
						isProcessingInvite.current = false;
						resolve();
					},
				},
			});
		});
	}, [processInput]);

	return (
		<View style={styles.container}>
			<Button
				text={i18n.t('scanInvite.scanInviteFor')}
				icon={<Scan size={19} />}
				rightIcon={<Image source={PubkyRingLogo} style={styles.logo} />}
				size="large"
				style={styles.button}
				textStyle={styles.text}
				onPress={handleInviteScan}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 0,
		justifyContent: 'flex-end',
	},
	button: {
		width: '90%',
		zIndex: 1,
	},
	text: {
		...textStyles.bodySSB,
	},
	logo: {
		height: 56,
		resizeMode: 'contain',
		backgroundColor: 'transparent',
	},
});

export default ScanInviteButton;
