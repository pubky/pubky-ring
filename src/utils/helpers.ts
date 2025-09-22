import {
	performAuth,
	signInToHomeserver,
} from './pubky.ts';
import { Dispatch } from 'redux';
import {
	err,
	ok,
	Result,
} from '@synonymdev/result';
import { parseAuthUrl } from '@synonymdev/react-native-pubky';
import Toast from 'react-native-toast-message';
import { ToastType } from 'react-native-toast-message/lib/src/types';
import { Dimensions, Linking, Platform, Share } from 'react-native';
import { getAutoAuthFromStore, getIsOnline } from './store-helpers.ts';
import { readFromClipboard } from './clipboard.ts';
import NetInfo from '@react-native-community/netinfo';
import { updateIsOnline } from '../store/slices/settingsSlice.ts';
import { setDeepLink } from '../store/slices/pubkysSlice.ts';
import {
	PUBKY_APP_URL,
	SHEET_ANIMATION_DELAY,
	SHEET_TRANSITION_DELAY,
	AUTH_SHEET_DELAY,
	ANDROID_DEEPLINK_DELAY
} from './constants.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { EBackupPreference } from '../types/pubky.ts';
import {
	mnemonicPhraseToKeypair,
	getPublicKeyFromSecretKey
} from '@synonymdev/react-native-pubky';

/**
 * Formats a signup/invite token to the XXXX-XXXX-XXXX pattern
 * Used for homeserver invite codes
 */
export const formatSignupToken = (text: string): string => {
	const cleaned = text.toUpperCase().replace(/[^A-Z0-9-]/g, '');
	if (!cleaned) return '';

	let result = '';
	let alphanumericCount = 0;

	for (let i = 0; i < cleaned.length; i++) {
		const char = cleaned[i];
		if (char === '-') {
			// Allow hyphen only at positions 4 and 9 (after 4 and 8 alphanumeric chars)
			if (alphanumericCount === 4 || alphanumericCount === 8) {
				// Only add if not already there
				if (result[result.length - 1] !== '-') {
					result += '-';
				}
			}
			// Skip invalid hyphens
		} else {
			if (alphanumericCount >= 12) break; // Max 12 alphanumeric chars
			// Auto-insert hyphen if needed
			if (
				(alphanumericCount === 4 || alphanumericCount === 8) &&
        result.length > 0 &&
        result[result.length - 1] !== '-'
			) {
				result += '-';
			}
			result += char;
			alphanumericCount++;
		}
	}

	return result;
};

/**
 * Validates if a signup token matches the expected format
 */
export const isValidSignupTokenFormat = (token: string): boolean => {
	return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(token);
};

/**
 * Determines if the provided data is a valid secret key or mnemonic phrase.
 * @param {string} data
 * @returns {Promise<Result<{ isSecretKey: boolean; backupPreference?: EBackupPreference }>>}
 */
export const isSecretKeyImport = async (data: string): Promise<Result<{
  isSecretKey: boolean;
  backupPreference?: EBackupPreference;
}>> => {
	data = formatImportData(data);
	let isSecretKey = false;
	let backupPreference = EBackupPreference.unknown;
	// Check if it's a valid mnemonic phrase
	const isMnemonicRes = await mnemonicPhraseToKeypair(data);
	if (isMnemonicRes.isOk()) {
		isSecretKey = true;
		backupPreference = EBackupPreference.recoveryPhrase;
	}
	if (!isSecretKey) {
		// Check if it's a valid secret key
		const isEncryptedFileRes = await getPublicKeyFromSecretKey(data);
		if (isEncryptedFileRes.isOk()) {
			isSecretKey = true;
			backupPreference = EBackupPreference.encryptedFile;
		}
	}
	if (!isSecretKey) {
		return err('Not a valid secret key or mnemonic phrase');
	}
	return ok({ isSecretKey, backupPreference });
};

export const handleScannedData = async ({
	pubky,
	data,
	dispatch,
	deepLink = false,
	skipImportSheet = false,
}: {
	pubky?: string,
	data: string,
	dispatch: Dispatch
	deepLink?: boolean;
	skipImportSheet?: boolean;
}): Promise<Result<string>> => {
	try {
		const isSecretKeyRes = await isSecretKeyImport(data);
		if (isSecretKeyRes.isOk() && isSecretKeyRes.value.isSecretKey) {
			data = formatImportData(data);
			// Ensure the camera sheet is closed on iOS
			if (Platform.OS === 'ios') {
				SheetManager.hide('camera');
			}

			// If skipImportSheet is true, import directly
			if (skipImportSheet) {
				const { importPubky } = await import('./pubky');
				const { showImportSuccessSheet, showEditPubkySheet } = await import('./sheetHelpers');
				const { getPubkyKeys } = await import('../store/selectors/pubkySelectors');
				const { getStore } = await import('./store-helpers');

				// Get current pubkys before import to determine if this is new
				const currentPubkys = getPubkyKeys(getStore());

				let secretKey = '';
				let mnemonic = '';

				if (isSecretKeyRes.value.backupPreference === EBackupPreference.recoveryPhrase) {
					mnemonic = data;
					// Convert mnemonic to secret key
					const keypairRes = await mnemonicPhraseToKeypair(data);
					if (keypairRes.isOk()) {
						secretKey = keypairRes.value.secret_key;
					} else {
						showToast({
							type: 'error',
							title: 'Import Failed',
							description: 'Invalid recovery phrase',
						});
						return err('Invalid recovery phrase');
					}
				} else {
					secretKey = data;
				}

				const importRes = await importPubky({
					secretKey,
					dispatch,
					mnemonic,
				});
				if (importRes.isOk()) {
					const isNewPubky = !currentPubkys.includes(importRes.value);
					// Show the import success sheet
					setTimeout(() => {
						showImportSuccessSheet({
							pubky: importRes.value,
							isNewPubky,
							onContinue: () => {
								setTimeout(() => {
									showEditPubkySheet({
										title: 'Setup',
										pubky: importRes.value,
									});
								}, SHEET_TRANSITION_DELAY);
							}
						});
					}, SHEET_ANIMATION_DELAY);
					return ok('Pubky imported successfully');
				} else {
					showToast({
						type: 'error',
						title: 'Import Failed',
						description: importRes.error.message,
					});
					return err(importRes.error.message);
				}
			}
		}

		if (!pubky) {
			showToast({
				type: 'error',
				title: 'No Pubky Selected',
				description: 'Please select a pubky to proceed',
			});
			return err('No pubky provided');
		}
		// Check if auth URL
		const authResult = await parseAuthUrl(data);
		if (authResult.isOk()) {
			const autoAuth = getAutoAuthFromStore();
			if (!autoAuth) {
				// Ensure the camera sheet is closed on iOS
				if (Platform.OS === 'ios') {
					SheetManager.hide('camera');
				}
				return await handleAuth({ pubky, authUrl: data, deepLink });
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
					await sleep(ANDROID_DEEPLINK_DELAY);
					Linking.openURL(PUBKY_APP_URL);
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
					await sleep(ANDROID_DEEPLINK_DELAY);
					Linking.openURL(PUBKY_APP_URL);
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

export const handleAuth = async ({
	pubky,
	authUrl,
	deepLink,
}: {
  pubky?: string;
  authUrl: string;
  deepLink?: boolean;
}): Promise<Result<string>> => {
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
		}, AUTH_SHEET_DELAY);
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

/**
 * Generic QR scanner function
 * @param onScan - Callback when QR code is scanned
 * @param onClipboard - Callback when clipboard button is pressed
 * @param onComplete - Optional callback when scanning is complete
 * @returns Promise<string> - Resolves with scanned data or clipboard data
 */
export const showQRScannerGeneric = async ({
	onScan,
	onClipboard,
	onComplete,
}: {
	onScan: (data: string) => Promise<string>;
	onClipboard: () => Promise<string>;
	onComplete?: () => void;
}): Promise<string> => {
	return new Promise<string>((resolve) => {
		SheetManager.show('camera', {
			payload: {
				onScan: async (data: string) => {
					await SheetManager.hide('camera');
					const result = await onScan(data);
					onComplete?.();
					resolve(result);
				},
				onCopyClipboard: async (): Promise<void> => {
					await SheetManager.hide('camera');
					const result = await onClipboard();
					resolve(result);
				},
				onClose: () => {
					SheetManager.hide('camera');
					resolve('');
				},
			},
		});
	});
};

export const showImportQRScanner = async ({
	dispatch,
	onComplete,
}: {
  dispatch: Dispatch;
  onComplete?: () => void;
}): Promise<string> => {
	return showQRScannerGeneric({
		onScan: async (data: string) => {
			const result = await handleScannedData({
				data,
				dispatch,
				skipImportSheet: true,
			});
			return result.isOk() ? 'success' : result.error.message;
		},
		onClipboard: async () => {
			const clipboardContents = await readFromClipboard();
			const data = formatImportData(clipboardContents);
			// Check if clipboard contains valid import data
			const isSecretKeyRes = await isSecretKeyImport(data);
			if (isSecretKeyRes.isOk() && isSecretKeyRes.value.isSecretKey) {
				const result = await handleScannedData({
					data,
					dispatch,
					skipImportSheet: true,
				});
				return result.isOk() ? 'success' : result.error.message;
			} else {
				showToast({
					type: 'error',
					title: 'Invalid Data',
					description: 'Clipboard does not contain a valid recovery phrase or secret key',
				});
				return 'Invalid clipboard data';
			}
		},
		onComplete,
	});
};

export const formatImportData = (data: string): string => {
	if (!data) return '';

	let formatted = data.trim();

	// Decode URL encoding if present
	if (formatted.includes('://') || formatted.includes('%20')) {
		try {
			formatted = decodeURIComponent(formatted);
		} catch {
			// Continue with original if decoding fails
		}
	}

	// Remove custom protocol prefix
	formatted = formatted.replace(/^pubkyring:\/\//, '');

	// Normalize word separators to spaces
	formatted = formatted.replace(/[-_+]+/g, ' ');

	return formatted;
};

export const showQRScanner = async ({
	pubky,
	dispatch,
	onComplete,
}: {
	pubky?: string;
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

	return showQRScannerGeneric({
		onScan: async (data: string) => {
			await handleScannedData({
				pubky,
				data,
				dispatch,
			});
			return data;
		},
		onClipboard: async () => {
			if (!pubky) {
				showToast({
					type: 'error',
					title: 'Error',
					description: 'No pubky provided for clipboard handling',
				});
				return 'No pubky provided';
			}
			const res = await handleClipboardData({ pubky, dispatch });
			return res.isOk() ? res.value : res.error.message;
		},
		onComplete,
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

export const handleClipboardData = async ({
	pubky,
	dispatch,
}: {
	pubky?: string;
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

export const isSmallScreen = (): boolean => {
	const { height } = Dimensions.get('window');
	return height < 700;
};

export const getToastStyle = (): {} => {
	const smallScreen = isSmallScreen();

	return {
		top: Platform.select({
			ios: smallScreen ? -25 : -80,
			android: smallScreen ? -25 : -80,
		}),
	};
};

export const parseInviteCode = (url: string): string | null => {
	// Pattern to match invite codes in format XXXX-XXXX-XXXX
	const invitePattern = /\/invite\/([A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4})/;
	const match = url.match(invitePattern);
	return match ? match[1] : null;
};
