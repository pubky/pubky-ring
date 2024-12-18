import { Alert } from 'react-native';
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
			Alert.alert('Success', `Signed in to ${data} successfully`);
			return ok('sign-in');
		}
		Alert.alert('Error', authResult?.error?.message ?? 'Failed to parse QR code data');
		return err('Failed to parse QR code data');
	} catch (error) {
		console.error('Error processing QR data:', error);
		Alert.alert('Error', 'Failed to process QR code data');
		return err('Failed to process QR code data');
	}
};

export const handleAuth = async (pubky: string, pubkyData: Pubky, authUrl: string): Promise<void> => {
	try {
		const authDetails = await parseAuthUrl(authUrl);
		if (authDetails.isErr()) {
			console.error('Error parsing auth details:', authDetails.error);
			Alert.alert('Error', authDetails?.error?.message ?? 'Failed to parse auth details');
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
		Alert.alert('Error', 'Failed to parse auth details');
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


export const showBackupPrompt = (
	secretKey: string,
	onComplete?: () => void
): void => {
	SheetManager.show('backup-prompt', {
		payload: {
			viewId: EBackupPromptViewId.backup,
			onSubmit: async (passphrase: string) => {
				try {
					const createRecoveryFileRes = await createRecoveryFile(
						secretKey,
						passphrase
					);

					if (createRecoveryFileRes.isErr()) {
						Alert.alert('Error', createRecoveryFileRes.error.message);
						return;
					}

					const fileName = generateBackupFileName();
					const backupRes = await backupPubky(createRecoveryFileRes.value, fileName);

					if (backupRes.isErr()) {
						Alert.alert('Error', backupRes.error.message);
					} else {
						Alert.alert(
							'Backup Created',
							`Backup saved as ${fileName}.pkarr`
						);
					}
					SheetManager.hide('backup-prompt').then();
					onComplete?.();
				} catch (error) {
					console.error('Backup creation error:', error);
					Alert.alert('Error', 'Failed to create backup file');
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
