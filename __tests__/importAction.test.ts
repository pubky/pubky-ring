import { ok, err } from '@synonymdev/result';
import { InputAction } from '../src/utils/inputParser';
import { executeImportAction, handleImportAction } from '../src/utils/actions/importAction';
import { importPubky } from '../src/utils/pubky';
import { mnemonicPhraseToKeypair } from '@synonymdev/react-native-pubky';
import { EBackupPreference } from '../src/types/pubky';

jest.mock('@synonymdev/react-native-pubky');

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	importPubky: jest.fn(),
}));

jest.mock('../src/store/selectors/pubkySelectors', () => ({
	__esModule: true,
	getPubkyKeys: jest.fn(() => []),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getStore: jest.fn(() => ({})),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	showSheet: jest.fn(),
	hideSheet: jest.fn(),
}));

const importPubkyMock = importPubky as jest.MockedFunction<typeof importPubky>;
const mnemonicPhraseToKeypairMock = mnemonicPhraseToKeypair as jest.MockedFunction<
	typeof mnemonicPhraseToKeypair
>;

const BIP39_TEST_MNEMONIC =
	'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

const dispatch = jest.fn();
const setAddPubkyScreen = jest.fn();

const deeplinkMnemonicImport = {
	action: InputAction.Import as const,
	params: {
		data: BIP39_TEST_MNEMONIC,
		backupPreference: EBackupPreference.recoveryPhrase,
	},
};

describe('H10 import confirmation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		importPubkyMock.mockResolvedValue(ok('imported-pubky'));
		mnemonicPhraseToKeypairMock.mockResolvedValue(
			ok({ secret_key: 'derived-secret', public_key: 'public-key', uri: 'pubky://public-key' }),
		);
	});

	it('does not persist a deeplink import before confirmation', async () => {
		const result = await handleImportAction(deeplinkMnemonicImport, {
			dispatch,
			isDeeplink: true,
			setAddPubkyScreen,
		});

		expect(result.isOk()).toBe(true);
		expect(importPubkyMock).not.toHaveBeenCalled();
		expect(mnemonicPhraseToKeypairMock).not.toHaveBeenCalled();
		expect(setAddPubkyScreen).toHaveBeenCalledWith({
			screen: 'ConfirmImport',
			params: {
				data: BIP39_TEST_MNEMONIC,
				backupPreference: EBackupPreference.recoveryPhrase,
			},
		});
	});

	it('persists after explicit executeImportAction', async () => {
		const result = await executeImportAction(deeplinkMnemonicImport, {
			dispatch,
			isDeeplink: true,
			setAddPubkyScreen,
		});

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toBe('imported-pubky');
		}
		expect(mnemonicPhraseToKeypairMock).toHaveBeenCalledWith(BIP39_TEST_MNEMONIC);
		expect(importPubkyMock).toHaveBeenCalledWith({
			secretKey: 'derived-secret',
			dispatch,
			mnemonic: BIP39_TEST_MNEMONIC,
		});
	});

	it('still imports immediately from in-app (non-deeplink) flows', async () => {
		const result = await handleImportAction(
			{
				action: InputAction.Import,
				params: {
					data: 'secret-key-material',
					backupPreference: EBackupPreference.encryptedFile,
				},
			},
			{ dispatch, isDeeplink: false, setAddPubkyScreen },
		);

		expect(result.isOk()).toBe(true);
		expect(importPubkyMock).toHaveBeenCalled();
		expect(setAddPubkyScreen).toHaveBeenCalledWith({
			screen: 'ImportSuccess',
			params: { pubky: 'imported-pubky', isNewPubky: true },
		});
	});

	it('does not persist when key derivation fails after confirmation', async () => {
		mnemonicPhraseToKeypairMock.mockResolvedValue(err(new Error('bad mnemonic')));

		const result = await executeImportAction(deeplinkMnemonicImport, {
			dispatch,
			isDeeplink: true,
			setAddPubkyScreen,
		});

		expect(result.isErr()).toBe(true);
		expect(importPubkyMock).not.toHaveBeenCalled();
	});
});
