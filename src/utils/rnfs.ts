import * as RNFS from '@dr.pogodin/react-native-fs';
import { Platform } from 'react-native';
import {
	check,
	request,
	PERMISSIONS,
	RESULTS,
} from 'react-native-permissions';
import { decryptRecoveryFile } from '@synonymdev/react-native-pubky';
import { Dispatch } from 'redux';
import { importPubky } from './pubky.ts';
import {
	err,
	ok,
	Result,
} from '@synonymdev/result';
import DocumentPicker from 'react-native-document-picker';
import { SheetManager } from 'react-native-actions-sheet';
import { EBackupPromptViewId } from '../components/BackupPrompt.tsx';
const Buffer = require('buffer').Buffer;

/**
 * Request minimal required permissions for file operations
 * @private Internal helper function
 */
const requestStoragePermission = async (): Promise<boolean> => {
	// iOS doesn't need explicit permissions for these operations
	if (Platform.OS === 'ios') {
		return true;
	}

	// Android 13+ doesn't need permissions for app-specific storage
	if (Platform.OS === 'android' && Platform.Version >= 33) {
		return true;
	}

	// For older Android versions, we need WRITE_EXTERNAL_STORAGE for backup
	try {
		const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
		const result = await check(permission);

		if (result === RESULTS.DENIED) {
			const requestResult = await request(permission);
			return requestResult === RESULTS.GRANTED;
		}

		return true;
	} catch (error) {
		console.error('Error checking permissions:', error);
		return false;
	}
};

/**
 * Get the appropriate directory for saving backup files
 * @private Internal helper function
 */
const getBackupDirectory = async (): Promise<string> => {
	if (Platform.OS === 'ios') {
		return RNFS.DocumentDirectoryPath;
	}
	return `${RNFS.DownloadDirectoryPath}/PubkyRing`;
};

/**
 * Ensure the backup directory exists
 * @private Internal helper function
 */
const ensureBackupDirectory = async (): Promise<Result<string>> => {
	try {
		const dir = await getBackupDirectory();
		const exists = await RNFS.exists(dir);
		if (!exists && Platform.OS === 'android') {
			await RNFS.mkdir(dir);
		}
		return ok(dir);
	} catch (error) {
		return err('Failed to create backup directory');
	}
};

/**
 * Imports a .pkarr file selected by the user
 * @returns Promise<Result<string>> The contents of the selected .pkarr file
 */
export async function importFile(dispatch: Dispatch): Promise<Result<string>> {
	// Check permissions first
	const hasPermission = await requestStoragePermission();
	if (!hasPermission) {
		return err('Storage permission denied');
	}

	try {
		const file = await DocumentPicker.pickSingle({
			type: [DocumentPicker.types.allFiles],
			copyTo: 'documentDirectory',
		});

		if (!file) {
			return err('No file selected');
		}

		const filePath = file.fileCopyUri || file.uri;

		if (!filePath) {
			return err('Invalid file path');
		}

		if (!filePath.toLowerCase().endsWith('.pkarr')) {
			return err('Please select a .pkarr file');
		}

		const fileName = file.name;

		const base64Content = await RNFS.readFile(filePath, 'base64');
		const fileStats = await RNFS.stat(filePath);


		return showImportPrompt({
			fileName: fileName ?? '',
			fileDate: fileStats.mtime,
			content: base64Content,
			dispatch,
		});

	} catch (error) {
		if (DocumentPicker.isCancel(error)) {
			return err('');
		}
		console.error('Import error:', error);
		return err('Failed to import pubky');
	}
}

export const showImportPrompt = ({
	fileName,
	fileDate,
	content,
	dispatch,
}: {
	fileName: string;
	fileDate: Date;
	content: string;
	dispatch: Dispatch
}): Promise<Result<string>> => {
	return new Promise((resolve) => {
		SheetManager.show('backup-prompt', {
			payload: {
				fileName,
				fileDate,
				viewId: EBackupPromptViewId.import,
				onSubmit: async (passphrase: string): Promise<Result<string>> => {
					try {
						const decryptRes = await decryptRecoveryFile(content, passphrase);
						if (decryptRes.isErr()) {
							return err(decryptRes.error.message);
						}

						const secretKey = decryptRes.value;
						const pubky = await importPubky(secretKey, dispatch);
						if (pubky.isErr()) {
							return err(pubky.error.message);
						}

						resolve(ok(pubky.value));
						SheetManager.hide('backup-prompt').then();
						return ok(pubky.value);
					} catch (error) {
						console.error('Import error:', error);
						return err('Failed to import pubky');
					}
				},
				onClose: () => {
					resolve(err(''));
					SheetManager.hide('backup-prompt');
				},
			},
		});
	});
};

export async function backupPubky(content: string, filename: string): Promise<Result<string>> {
	try {
		// For Android, we need storage permission
		if (Platform.OS === 'android') {
			const hasPermission = await requestStoragePermission();
			if (!hasPermission) {
				return err('Storage permission denied');
			}
		}

		// Ensure backup directory exists
		const dirResult = await ensureBackupDirectory();
		if (dirResult.isErr()) {
			return err(dirResult.error.message);
		}

		const fullFilename = filename.endsWith('.pkarr') ? filename : `${filename}.pkarr`;
		const filepath = `${dirResult.value}/${fullFilename}`;

		await RNFS.writeFile(filepath, Buffer.from(content, 'base64'));

		if (Platform.OS === 'android') {
			await RNFS.scanFile(filepath);
		}

		return ok(filepath);
	} catch (error) {
		if (error instanceof Error) {
			return err(`Failed to backup pubky file: ${error.message}`);
		}
		return err('Failed to backup pubky file');
	}
}
