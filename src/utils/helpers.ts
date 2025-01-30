import { SheetManager } from 'react-native-actions-sheet';
import {
	performAuth,
	signInToHomeserver,
} from './pubky.ts';
import { createRecoveryFile } from '@synonymdev/react-native-pubky';
import { backupPubky } from './rnfs.ts';
import { Dispatch } from 'redux';
import { EBackupPromptViewId } from '../components/BackupPrompt.tsx';
import {
	err,
	ok,
	Result,
} from '@synonymdev/result';
import { parseAuthUrl } from '@synonymdev/react-native-pubky';
import Toast from 'react-native-toast-message';
import { ToastType } from 'react-native-toast-message/lib/src/types';
import { Platform, Share } from 'react-native';
import { getAutoAuthFromStore } from './store-helpers.ts';
import { getKeychainValue } from './keychain.ts';
import { readFromClipboard } from './clipboard.ts';

export const handleScannedData = async ({
	pubky,
	data,
	dispatch,
}: {
	pubky: string,
	data: string,
	dispatch: Dispatch
}): Promise<Result<string>> => {
	try {
		const authResult = await parseAuthUrl(data);
		if (authResult.isOk()) {
			const autoAuth = getAutoAuthFromStore();
			if (!autoAuth) {
				// Ensure the camera sheet is closed on iOS
				if (Platform.OS === 'ios') {
					SheetManager.hide('camera');
				}
				return await handleAuth(pubky, data);
			}

			// Auto-auth flow
			const res = await performAuth({
				pubky,
				authUrl: data,
				dispatch,
			});
			// If auth was successful, show a success toast since they will have no indication in the autoAuth flow otherwise.
			if (res.isOk()) {
				showToast({
					type: 'success',
					title: 'Success',
					description: `Authorized with: pk:${pubky}`,
				});
			} else {
				showToast({
					type: 'error',
					title: 'Error',
					description: res.error.message,
				});
			}
			return res;
		}

		const signInRes = await signInToHomeserver(pubky, data, dispatch);
		if (signInRes.isOk()) {
			showToast({
				type: 'success',
				title: 'Success',
				description: `Signed in to ${data} successfully`,
			});
			return ok('sign-in');
		}
		const description = authResult?.error?.message ?? 'Failed to parse QR code data';
		showToast({
			type: 'error',
			title: 'Error',
			description,
		});
		return err('Failed to parse QR code data');
	} catch (error) {
		console.error('Error processing QR data:', error);
		showToast({
			type: 'error',
			title: 'Error',
			description: 'Failed to process QR code data',
		});
		return err('Failed to process QR code data');
	}
};

export const handleAuth = async (pubky: string, authUrl: string): Promise<Result<string>> => {
	try {
		const authDetails = await parseAuthUrl(authUrl);
		if (authDetails.isErr()) {
			console.error('Error parsing auth details:', authDetails.error);
			const description = authDetails?.error?.message ?? 'Failed to parse auth details';
			showToast({
				type: 'error',
				title: 'Error',
				description,
			});
			return err(description);
		}
		// Small timeout allows the sheet time to properly display and not get stuck.
		setTimeout(() => {
			SheetManager.show('confirm-auth', {
				payload: {
					pubky,
					authUrl,
					authDetails: authDetails.value,
					onComplete: async (): Promise<void> => {
					},
				},
				onClose: () => {
					SheetManager.hide('confirm-auth');
				},
			});
		}, 50);
		return ok('success');
	} catch (error) {
		const description = 'Failed to parse auth details';
		showToast({
			type: 'error',
			title: 'Error',
			description,
		});
		console.log(`${description}:`, error);
		return err(description);
	}
};

export const showQRScanner = ({
	pubky,
	dispatch,
	onComplete,
}: {
	pubky: string;
	dispatch: Dispatch;
	onComplete?: () => void;
}): Promise<string> => {
	return new Promise<string>((resolve) => {
		SheetManager.show('camera', {
			payload: {
				onScan: async (data: string) => {
					await SheetManager.hide('camera');
					await handleScannedData({
						pubky,
						data,
						dispatch,
					});
					onComplete?.();
					resolve(data);
				},
				onCopyClipboard: async (): Promise<void> => {
					await SheetManager.hide('camera');
					const res = await handleClipboardData({ pubky, dispatch });
					resolve(res.isOk() ? res.value : res.error.message);
				},
				onClose: () => {
					SheetManager.hide('camera');
					resolve('');
				},
			},
		});
	});
};

export const generateBackupFileName = (prefix: string = 'pubky-backup'): string => {
	// Format: pubky-backup-YYYY-MM-DD_HH-MM-SS
	const now = new Date();

	// Extracting parts of the date and time
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	const date = `${year}-${month}-${day}`;
	const time = `${hours}-${minutes}-${seconds}`;

	return `${prefix}-${date}_${time}`;
};


export const showBackupPrompt = ({
	pubky,
	onComplete,
}: {
	pubky: string,
	onComplete?: () => void
}): void => {
	SheetManager.show('backup-prompt', {
		payload: {
			viewId: EBackupPromptViewId.backup,
			pubky,
			onSubmit: async (passphrase: string) => {
				try {
					const secretKeyResponse = await getKeychainValue({ key: pubky });
					if (secretKeyResponse.isErr()) {
						showToast({
							type: 'error',
							title: 'Error',
							description: 'Could not retrieve secret key for backup',
						});
						return;
					}
					const createRecoveryFileRes = await createRecoveryFile(
						secretKeyResponse.value,
						passphrase
					);

					if (createRecoveryFileRes.isErr()) {
						showToast({
							type: 'error',
							title: 'Error',
							description: createRecoveryFileRes.error.message,
						});
						return;
					}

					const fileName = generateBackupFileName();
					const backupRes = await backupPubky(createRecoveryFileRes.value, fileName);

					if (backupRes.isErr()) {
						showToast({
							type: 'error',
							title: 'Error',
							description: backupRes.error.message,
						});
					} else {
						showToast({
							type: 'success',
							title: 'Backup Created',
							description: `${fileName}.pkarr`,
						});
					}
					SheetManager.hide('backup-prompt').then();
					onComplete?.();
				} catch (error) {
					console.error('Backup creation error:', error);
					showToast({
						type: 'error',
						title: 'Error',
						description: 'Failed to create backup file',
					});
				}
			},
			onClose: () => SheetManager.hide('backup-prompt'),
		},
	});
};

export const showNamePubkyPrompt = ({
	pubky,
	pubkyName,
}: {
	pubky: string;
	pubkyName: string;
}): void => {
	SheetManager.show('name-pubky-prompt', {
		payload: {
			pubky,
			pubkyName,
			onClose: () => SheetManager.hide('name-pubky-prompt'),
		},
	});
};

export const handleClipboardData = async ({
	pubky,
	dispatch,
}: {
	pubky: string;
	dispatch: Dispatch;
}): Promise<Result<string>> => {
	const clipboardContents = await readFromClipboard();
	return await handleScannedData({
		pubky,
		data: clipboardContents,
		dispatch,
	});
};

export type ToastOptions = {
	type: ToastType;
	title: string;
	description: string;
	autoHide?: boolean;
	visibilityTime?: number;
	onPress?: () => void;
};

const defaultOptions = {
	autoHide: true,
	visibilityTime: 4000,
	topOffset: Platform.OS === 'ios' ? 40 : 0,
	//bottomOffset: 120,
};

export const showToast = ({
	type,
	title,
	description,
	autoHide,
	visibilityTime,
	onPress,
}: ToastOptions): void => {
	Toast.show({
		...defaultOptions,
		type,
		text1: title,
		text2: description,
		position: 'top',
		autoHide,
		visibilityTime,
		onPress,
	});
};

export const shareData = async (data: string): Promise<void> => {
	try {
		await Share.share({
			message: data,
		});
	} catch (error) {
		console.error('Error sharing data:', error);
		showToast({
			type: 'error',
			title: 'Error',
			description: 'Failed to share data',
		});
	}
};
