import { SheetManager } from 'react-native-actions-sheet';
import { readFromClipboard } from './clipboard';
import {
	signInToHomeserver,
} from './pubky.ts';
import { createRecoveryFile } from '@synonymdev/react-native-pubky';
import { backupPubky } from './rnfs.ts';
import { Pubky } from '../types/pubky.ts';
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
import { Platform } from 'react-native';

export const handleScannedData = async (
	pubky: string,
	pubkyData: Pubky,
	data: string,
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		const authResult = await parseAuthUrl(data);
		if (authResult.isOk()) {
			await handleAuth(pubky, pubkyData, data);
			return ok('auth');
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
		showToast({
			type: 'error',
			title: 'Error',
			description: authResult?.error?.message ?? 'Failed to parse QR code data',
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

export const handleAuth = async (pubky: string, pubkyData: Pubky, authUrl: string): Promise<void> => {
	try {
		const authDetails = await parseAuthUrl(authUrl);
		if (authDetails.isErr()) {
			console.error('Error parsing auth details:', authDetails.error);
			showToast({
				type: 'error',
				title: 'Error',
				description: authDetails?.error?.message ?? 'Failed to parse auth details',
			});
			return;
		}
		SheetManager.show('confirm-auth', {
			payload: {
				pubky,
				pubkyData,
				authUrl,
				authDetails: authDetails.value,
				onComplete: async (): Promise<void> => {
				},
			},
		}).then();
	} catch (error) {
		showToast({
			type: 'error',
			title: 'Error',
			description: 'Failed to parse auth details',
		});
		console.log('Error parsing auth details:', error);
	}
};

export const showQRScanner = (pubky: string, pubkyData: Pubky, dispatch: Dispatch, onComplete?: () => void): Promise<string> => {
	return new Promise<string>((resolve) => {
		SheetManager.show('camera', {
			payload: {
				onScan: async (data: string) => {
					await SheetManager.hide('camera');
					handleScannedData(pubky, pubkyData, data, dispatch)
						.then(() => {
							resolve(data);
						});
					onComplete?.();
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
	secretKey,
	pubky,
	onComplete,
}: {
	secretKey: string,
	pubky: string,
	onComplete?: () => void
}): void => {
	SheetManager.show('backup-prompt', {
		payload: {
			viewId: EBackupPromptViewId.backup,
			pubky,
			onSubmit: async (passphrase: string) => {
				try {
					const createRecoveryFileRes = await createRecoveryFile(
						secretKey,
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

export const handleClipboardData = async (pubky: string, pubkyData: Pubky, dispatch: Dispatch): Promise<Result<string>> => {
	const clipboardContents = await readFromClipboard();
	return handleScannedData(pubky, pubkyData, clipboardContents, dispatch);
};

export type ToastOptions = {
	type: ToastType;
	title: string;
	description: string;
	autoHide?: boolean;
	visibilityTime?: number;
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
}: ToastOptions): void => {
	Toast.show({
		...defaultOptions,
		type,
		text1: title,
		text2: description,
		position: 'top',
		autoHide,
		visibilityTime,
	});
};
