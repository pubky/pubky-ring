import { Platform } from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import Share from 'react-native-share';
import { sanitizeFileName } from '../src/utils/fileName';
import { backupPubky } from '../src/utils/rnfs';

jest.mock('@dr.pogodin/react-native-fs', () => ({
	__esModule: true,
	TemporaryDirectoryPath: '/tmp',
	DocumentDirectoryPath: '/docs',
	DownloadDirectoryPath: '/downloads',
	writeFile: jest.fn(async () => undefined),
	exists: jest.fn(async () => true),
	mkdir: jest.fn(async () => undefined),
	unlink: jest.fn(async () => undefined),
	readFile: jest.fn(async () => ''),
	stat: jest.fn(async () => ({ mtime: new Date(0) })),
	scanFile: jest.fn(async () => undefined),
}));

jest.mock('react-native-permissions', () => ({
	check: jest.fn(async () => 'granted'),
	request: jest.fn(async () => 'granted'),
	PERMISSIONS: { ANDROID: { WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE' } },
	RESULTS: { DENIED: 'denied', GRANTED: 'granted' },
}));

jest.mock('@react-native-documents/picker', () => ({
	pick: jest.fn(),
	keepLocalCopy: jest.fn(),
}));

jest.mock('react-native-share', () => ({
	__esModule: true,
	default: { open: jest.fn(async () => ({ success: true })) },
}));

const writeFileMock = RNFS.writeFile as jest.MockedFunction<typeof RNFS.writeFile>;
const shareOpenMock = Share.open as jest.MockedFunction<typeof Share.open>;

// Name and timestamp from the backup that failed on iOS with
// "ENOENT: no such file or directory, open '.../tmp//the-biz-/-usr2ios-backup-2026-09-06_08-46-07.pkarr'"
const nameWithSlash = 'the-biz-/-usr2ios-backup-2026-09-06_08-46-07';

describe('sanitizeFileName', () => {
	it('replaces path separators so the name cannot become a path', () => {
		expect(sanitizeFileName('the-biz-/-usr2ios-backup')).toBe('the-biz---usr2ios-backup');
		expect(sanitizeFileName('work\\identity')).toBe('work-identity');
	});

	it('replaces the characters the Android and iOS file APIs reject', () => {
		expect(sanitizeFileName('a:b*c?d"e<f>g|h')).toBe('a-b-c-d-e-f-g-h');
	});

	it('drops control characters', () => {
		expect(sanitizeFileName('back\u0000up\u001f')).toBe('back-up');
	});

	it('removes leading dots and dashes and trailing whitespace and dots', () => {
		expect(sanitizeFileName('.hidden')).toBe('hidden');
		expect(sanitizeFileName('name. ')).toBe('name');
		expect(sanitizeFileName('  spaced  ')).toBe('spaced');
	});

	it('falls back when nothing usable is left', () => {
		expect(sanitizeFileName('')).toBe('pubky-backup');
		expect(sanitizeFileName('../')).toBe('pubky-backup');
		expect(sanitizeFileName('/', 'identity')).toBe('identity');
	});

	it('keeps names that are already valid, including unicode', () => {
		expect(sanitizeFileName('My Pubky 2')).toBe('My Pubky 2');
		expect(sanitizeFileName('café-🙂')).toBe('café-🙂');
	});

	it('is idempotent, so an already sanitized name is left alone', () => {
		const sanitized = sanitizeFileName('The Biz / usr2ios-backup');
		expect(sanitizeFileName(sanitized)).toBe(sanitized);
	});
});

describe('backupPubky', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('writes the iOS backup to a file name without a path separator', async () => {
		const res = await backupPubky('Y29udGVudA==', nameWithSlash);

		expect(res.isOk()).toBe(true);
		expect(writeFileMock).toHaveBeenCalledTimes(1);
		expect(writeFileMock).toHaveBeenCalledWith(
			'/tmp/the-biz---usr2ios-backup-2026-09-06_08-46-07.pkarr',
			'Y29udGVudA==',
			'base64',
		);
	});

	it('writes the Android backup to a file name without a path separator', async () => {
		const platform = Platform.OS;
		Platform.OS = 'android';
		try {
			const res = await backupPubky('Y29udGVudA==', nameWithSlash);

			expect(res.isOk()).toBe(true);
			expect(writeFileMock).toHaveBeenCalledWith(
				'/downloads/PubkyRing/the-biz---usr2ios-backup-2026-09-06_08-46-07.pkarr',
				expect.anything(),
			);
		} finally {
			Platform.OS = platform;
		}
	});

	it('keeps the .pkarr extension and does not add it twice', async () => {
		await backupPubky('Y29udGVudA==', 'backup.pkarr');

		expect(writeFileMock).toHaveBeenCalledWith('/tmp/backup.pkarr', 'Y29udGVudA==', 'base64');
	});

	it('uses the fallback name while preserving the .pkarr extension', async () => {
		await backupPubky('Y29udGVudA==', '/');

		expect(writeFileMock).toHaveBeenCalledWith('/tmp/pubky-backup.pkarr', 'Y29udGVudA==', 'base64');
	});

	it('shares the backup file on iOS and cleans up the temp file', async () => {
		await backupPubky('Y29udGVudA==', 'identity-backup');

		expect(shareOpenMock).toHaveBeenCalledWith(
			expect.objectContaining({
				filename: 'identity-backup.pkarr',
				url: 'file:///tmp/identity-backup.pkarr',
			}),
		);
		expect(RNFS.unlink).toHaveBeenCalledWith('/tmp/identity-backup.pkarr');
	});
});
