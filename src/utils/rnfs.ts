import * as RNFS from '@dr.pogodin/react-native-fs';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { err, ok, Result } from '@synonymdev/result';
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import Share, { ShareOptions } from 'react-native-share';
import type { ImportFileScreenParams } from '../sheets/types.ts';

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
	} catch {
		return err('Failed to create backup directory');
	}
};

/**
 * Picks and reads a .pkarr file selected by the user.
 */
export async function importFile(): Promise<Result<ImportFileScreenParams>> {
	// Check permissions first
	const hasPermission = await requestStoragePermission();
	if (!hasPermission) {
		return err('Storage permission denied');
	}

	try {
		const [file] = await pick();
		if (!file) {
			return err('No file selected');
		}
		const { name, uri } = file;

		// Get filename from name or extract from URI as fallback
		const fileName = name || decodeURIComponent(uri.split('/').pop() || '');

		const sanitizedName = fileName.replace(/\s+/g, '_');

		const [copyResult] = await keepLocalCopy({
			files: [
				{
					uri,
					fileName: sanitizedName,
				},
			],
			destination: 'documentDirectory',
		});

		if (copyResult.status !== 'success') {
			const errorMsg = `Failed to create local copy of file: ${copyResult.status}`;
			console.error(errorMsg, copyResult);
			return err(errorMsg);
		}

		const filePath = copyResult.localUri;
		if (!filePath) {
			const errorMsg = 'Failed to get local file path after copy';
			console.error(errorMsg, { copyResult });
			return err(errorMsg);
		}

		const encodedPath = encodeURI(filePath);

		// Read the file and let decryptRecoveryFile handle format validation
		const base64Content = await RNFS.readFile(encodedPath, 'base64');

		let fileDate: Date | undefined;
		try {
			const fileStats = await RNFS.stat(encodedPath);
			fileDate = fileStats.mtime;
		} catch (statError) {
			console.warn('Could not get file stats, using current date:', statError);
		}

		return ok({
			fileName,
			fileDate: fileDate?.getTime(),
			content: base64Content,
		});
	} catch (error) {
		const errMsg = `Failed to import file: ${JSON.stringify(error)}`;
		try {
			if (error && typeof error === 'object' && 'code' in error && error?.code === 'OPERATION_CANCELED') {
				return err(error.code);
			}
		} catch {
			return err(errMsg);
		}
		return err(errMsg);
	}
}

export async function backupPubky(content: string, filename: string): Promise<Result<string>> {
	// Ensure filename ends with .pkarr
	const fullFilename = filename.endsWith('.pkarr') ? filename : `${filename}.pkarr`;

	try {
		if (Platform.OS === 'ios') {
			// iOS: Use share sheet approach
			// Build a temp path
			const tempPath = `${RNFS.TemporaryDirectoryPath}/${fullFilename}`;
			const fileUrl = `file://${tempPath}`;

			// Write the file to temp location
			await RNFS.writeFile(tempPath, content, 'base64');

			// Prepare share options for iOS
			const shareOptions: ShareOptions = {
				url: fileUrl,
				type: 'application/octet-stream',
				filename: fullFilename,
				subject: 'Pubky Backup',
				title: 'Save Pubky Backup',
				failOnCancel: false,
				saveToFiles: true,
			};

			// Show the native share sheet
			const shareResult = await Share.open(shareOptions);

			// Clean up the temp file
			await RNFS.unlink(tempPath);

			// Check if user dismissed the share modal
			if (!shareResult.success) {
				return err('User canceled backup');
			}

			return ok(tempPath);
		} else if (Platform.OS === 'android') {
			// Check for storage permission
			const hasPermission = await requestStoragePermission();
			if (!hasPermission) {
				return err('Storage permission denied');
			}

			// Ensure backup directory exists
			const dirResult = await ensureBackupDirectory();
			if (dirResult.isErr()) {
				return err(dirResult.error.message);
			}

			const filepath = `${dirResult.value}/${fullFilename}`;

			await RNFS.writeFile(filepath, Buffer.from(content, 'base64'));
			await RNFS.scanFile(filepath);

			return ok(filepath);
		} else {
			return err('Unsupported platform');
		}
	} catch (error) {
		if (error instanceof Error) {
			if (error.message?.includes('User did not share')) {
				return err('User canceled backup');
			}
			return err(`Failed to backup pubky file: ${error.message}`);
		}

		return err('Failed to backup pubky file');
	}
}
