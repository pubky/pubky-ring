import { SheetManager } from 'react-native-actions-sheet';
import {
	getPubkySecretKey,
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
import { getAutoAuthFromStore, getBackupPreference, getIsOnline, getStore } from './store-helpers.ts';
import { readFromClipboard } from './clipboard.ts';
import NetInfo from '@react-native-community/netinfo';
import { updateIsOnline } from '../store/slices/settingsSlice.ts';
import { setDeepLink } from '../store/slices/pubkysSlice.ts';
import { defaultPubkyState } from '../store/shapes/pubky.ts';
import { EBackupPreference, Pubky } from '../types/pubky.ts';

export const handleScannedData = async ({
	pubky,
	data,
	dispatch,
	deepLink = false,
}: {
	pubky: string,
	data: string,
	dispatch: Dispatch
	deepLink?: boolean;
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
				return await handleAuth(pubky, data, deepLink);
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
			if (deepLink && res.isOk()) {
				if (Platform.OS === 'android') {
					await sleep(250);
					//Linking.openURL(PUBKY_APP_URL);
				} else {
					showToast({
						type: 'info',
						title: 'Successfully Signed In!',
						description: 'Please navigate back to your browser',
						visibilityTime: 8000,
					});
				}
			}
			return res;
		}

		const signInRes = await signInToHomeserver({
			pubky,
			dispatch,
		});
		if (signInRes.isOk()) {
			showToast({
				type: 'success',
				title: 'Success',
				description: `Signed in to ${data} successfully`,
			});
			if (deepLink && signInRes.isOk()) {
				if (Platform.OS === 'android') {
					await sleep(250);
					//Linking.openURL(PUBKY_APP_URL);
				} else {
					showToast({
						type: 'info',
						title: 'Successfully Signed In!',
						description: 'Please navigate back to your browser.',
						visibilityTime: 8000,
					});
				}
			}
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

export const handleAuth = async (pubky: string, authUrl: string, deepLink?: boolean): Promise<Result<string>> => {
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
					deepLink,
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

export const showQRScanner = async ({
	pubky,
	dispatch,
	onComplete,
}: {
	pubky: string;
	dispatch: Dispatch;
	onComplete?: () => void;
}): Promise<string> => {
	const isOnline = getIsOnline();
	if (!isOnline) {
		// Double check network connection in case it came back.
		const res = await checkNetworkConnection({
			prevNetworkState: isOnline,
			dispatch,
			displayToastIfOnline: false,
			displayToastIfOffline: false,
		});
		if (!res) {
			showToast({
				type: 'error',
				title: 'Currently Offline',
				description: 'You need to be online to authorize with Pubky Ring',
				autoHide: false,
			});
			return Promise.resolve('');
		}
	}
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

export const showBackupPrompt = async ({
	pubky,
	backupPreference,
	onComplete,
}: {
	pubky: string,
	backupPreference?: EBackupPreference;
	onComplete?: () => void
}): Promise<void> => {
	const secretKeyResponse = await getPubkySecretKey(pubky);
	if (secretKeyResponse.isErr()) {
		showToast({
			type: 'error',
			title: 'Error',
			description: 'Could not retrieve secret key for backup',
		});
		return;
	}

	if (!backupPreference) {
		backupPreference = getBackupPreference(pubky);
	}

	if (
		backupPreference === EBackupPreference.recoveryPhrase &&
		secretKeyResponse.value?.mnemonic
	) {
		SheetManager.show('recovery-phrase-prompt', {
			payload: {
				pubky,
				mnemonic: secretKeyResponse.value.mnemonic,
				onClose: () => SheetManager.hide('recovery-phrase-prompt'),
			},
		});
		return;
	}

	SheetManager.show('backup-prompt', {
		payload: {
			viewId: EBackupPromptViewId.backup,
			pubky,
			onSubmit: async (passphrase: string) => {
				try {
					const createRecoveryFileRes = await createRecoveryFile(
						secretKeyResponse.value.secretKey,
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

					let pubkyName;
					try {
						const name = getStore().pubky.pubkys[pubky]?.name;
						if (typeof name === 'string' && name.trim()) {
							pubkyName = name.toLowerCase().replace(/\s+/g, '-') + '-backup';
						}
					} catch {}

					const fileName = generateBackupFileName(pubkyName);
					const backupRes = await backupPubky(createRecoveryFileRes.value, fileName);

					if (backupRes.isErr()) {
						if (backupRes.error.message.includes('User canceled backup')) {
							return;
						}
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

/**
 * Checks the network connection and updates the store if the connection state has changed.
 * @param {boolean} [prevNetworkState] - The previous network state.
 * @param {Dispatch} [dispatch] - The Redux dispatch function.
 * @param {boolean} [displayToast] - Whether to display a toast message.
 */
export const checkNetworkConnection = async ({
	prevNetworkState,
	dispatch,
	displayToastIfOnline = true,
	displayToastIfOffline = true,
}: {
	prevNetworkState?: boolean;
	dispatch?: Dispatch;
	displayToastIfOnline?: boolean;
	displayToastIfOffline?: boolean;
}): Promise<boolean> => {
	if (!prevNetworkState) {
		prevNetworkState = getIsOnline();
	}
	const state = await NetInfo.fetch();
	const isConnected = state?.isConnected ?? false;
	if (prevNetworkState !== isConnected) {
		if (dispatch) {
			dispatch(updateIsOnline({ isOnline: isConnected }));
		}
		if (isConnected && displayToastIfOnline) {
			showToast({
				type: 'success',
				title: "You're Back Online!",
				description: 'You can now authorize with Pubky Ring',
			});
		} else if (!isConnected && displayToastIfOffline) {
			showToast({
				type: 'error',
				title: 'Currently Offline',
				description: 'You need to be online to authorize with Pubky Ring',
				autoHide: false,
			});
		}
	}
	return isConnected;
};

export const parseDeepLink = (url: string): string => {
	if (url.startsWith('pubkyring://')) {
		url = url.replace('pubkyring://', '');
		if (url.startsWith('pubkyauth///')) {
			url = url.replace('pubkyauth///', 'pubkyauth:///');
		}
	}
	return url;
};

export const handleDeepLink = ({
	pubky,
	url,
	dispatch,
}: {
	pubky: string;
	url: string;
	dispatch: Dispatch;
}): string => {
	try {
		url = decodeURIComponent(decodeURIComponent(url));
	} catch {}
	handleScannedData({
		pubky,
		data: url,
		dispatch,
		deepLink: true,
	});
	dispatch(setDeepLink('')); // Reset deep link once used.
	return '';
};

export const showEditPubkyPrompt = ({
	title = 'Edit',
	description = '',
	pubky,
	data = { ...defaultPubkyState },
}: {
	title?: string;
	description?: string;
	pubky: string;
	data?: Pubky;
}): void => {
	SheetManager.show('edit-pubky', {
		payload: {
			title,
			description,
			pubky,
			data,
		},
		onClose: () => SheetManager.hide('edit-pubky'),
	});
};

/**
 * Pauses execution of a function.
 * @param {number} ms The time to wait in milliseconds.
 * @returns {Promise<void>}
 */
export const sleep = (ms = 1000): Promise<void> => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};
