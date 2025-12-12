/**
 * Helper utilities for Pubky Ring
 *
 * For input handling (deeplinks, QR scans, clipboard), use:
 * - parseInput() from ./inputParser.ts
 * - routeInput() from ./inputRouter.ts
 */

import { Dispatch } from 'redux';
import Toast from 'react-native-toast-message';
import { ToastType } from 'react-native-toast-message/lib/src/types';
import { Dimensions, Platform, Share } from 'react-native';
import { getIsOnline } from './store-helpers.ts';
import NetInfo from '@react-native-community/netinfo';
import { updateIsOnline } from '../store/slices/settingsSlice.ts';
import { EBackupPreference } from '../types/pubky.ts';
import {
	mnemonicPhraseToKeypair,
	getPublicKeyFromSecretKey
} from '@synonymdev/react-native-pubky';
import i18n from '../i18n';
import { err, ok, Result } from '@synonymdev/result';

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
 * Formats raw import data by normalizing it for validation
 */
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
			title: i18n.t('common.error'),
			description: i18n.t('errors.failedToShareData'),
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
				title: i18n.t('network.backOnline'),
				description: i18n.t('network.backOnlineDescription'),
			});
		} else if (!isConnected && displayToastIfOffline) {
			showToast({
				type: 'error',
				title: i18n.t('network.currentlyOffline'),
				description: i18n.t('network.offlineDescription'),
				autoHide: false,
			});
		}
	}
	return isConnected;
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
	const invitePattern = /\invite\/([A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4})/;
	const match = url.match(invitePattern);
	return match ? match[1] : null;
};
