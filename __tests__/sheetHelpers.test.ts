import { showToast } from '@synonymdev/react-native-toast';
import { showBackupSheet } from '../src/utils/sheetHelpers';
import { showSheet } from '../src/sheets/sheetNavigation';
import { getPubkySecretKey } from '../src/utils/pubky';
import { getStore } from '../src/utils/store-helpers';

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	showSheet: jest.fn(),
}));

// The real module reaches the keychain and the native bridge.
jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	getPubkySecretKey: jest.fn(),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getStore: jest.fn(),
	// EBackupPreference.encryptedFile, spelled out because a mock factory may not close over it.
	getBackupPreference: jest.fn(() => 'encryptedFile'),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key },
}));

const showToastMock = showToast as jest.MockedFunction<typeof showToast>;
const showSheetMock = showSheet as jest.MockedFunction<typeof showSheet>;
const getPubkySecretKeyMock = getPubkySecretKey as jest.MockedFunction<typeof getPubkySecretKey>;
const getStoreMock = getStore as jest.MockedFunction<typeof getStore>;

const PUBKY = 'pubkyOne';

const storeWith = (sourceApp?: string): ReturnType<typeof getStore> =>
	({ pubky: { pubkys: { [PUBKY]: { sourceApp } } } }) as unknown as ReturnType<typeof getStore>;

beforeEach(() => {
	jest.clearAllMocks();
});

test('refuses to back up a borrowed identity and says where to do it instead', async () => {
	getStoreMock.mockReturnValue(storeWith('to.bitkit'));

	await showBackupSheet({ pubky: PUBKY });

	expect(showSheetMock).not.toHaveBeenCalled();
	// The secret is never even fetched: a borrowed key must not leave its source app.
	expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
	expect(showToastMock).toHaveBeenCalledWith(
		expect.objectContaining({ description: 'reuseSharedPubky.backupManagedByBitkit' }),
	);
});

test('still opens the backup sheet for an owned identity', async () => {
	getStoreMock.mockReturnValue(storeWith('app.pubkyring'));

	await showBackupSheet({ pubky: PUBKY });

	expect(showSheetMock).toHaveBeenCalledWith('backup', { screen: 'BackupFileScreen', params: { pubky: PUBKY } });
	expect(showToastMock).not.toHaveBeenCalled();
});
