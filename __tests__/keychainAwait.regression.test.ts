import { err, ok } from '@synonymdev/result';
import { deletePubky, savePubky } from '../src/utils/pubky';
import {
	resetKeychainValue,
	resetPubkySessionSecrets,
	setKeychainValue,
	wipeKeychain,
} from '../src/utils/keychain';
import { wipeRingCustody } from '../src/utils/wipeRing';
import { addPubky, removePubky, resetPubkys } from '../src/store/slices/pubkysSlice';
import { resetSettings } from '../src/store/slices/settingsSlice';
import { EBackupPreference } from '../src/types/pubky';

jest.mock('@synonymdev/react-native-pubky');

jest.mock('uuid', () => ({
	__esModule: true,
	v5: jest.fn(() => 'session-id'),
}));

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

jest.mock('../src/utils/helpers.ts', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(async () => true),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getPubkyDataFromStore: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	addProcessing: jest.fn(payload => ({ type: 'pubky/addProcessing', payload })),
	addPubky: jest.fn(payload => ({ type: 'pubky/addPubky', payload })),
	addSession: jest.fn(payload => ({ type: 'pubky/addSession', payload })),
	removeProcessing: jest.fn(payload => ({ type: 'pubky/removeProcessing', payload })),
	removePubky: jest.fn(payload => ({ type: 'pubky/removePubky', payload })),
	removeSession: jest.fn(payload => ({ type: 'pubky/removeSession', payload })),
	resetPubkys: jest.fn(() => ({ type: 'pubky/resetPubkys' })),
	setHomeserver: jest.fn(payload => ({ type: 'pubky/setHomeserver', payload })),
	setPubkyData: jest.fn(payload => ({ type: 'pubky/setPubkyData', payload })),
	setSignedUp: jest.fn(payload => ({ type: 'pubky/setSignedUp', payload })),
}));

jest.mock('../src/store/slices/settingsSlice', () => ({
	__esModule: true,
	resetSettings: jest.fn(() => ({ type: 'settings/resetSettings' })),
}));

jest.mock('../src/utils/keychain', () => ({
	__esModule: true,
	setKeychainValue: jest.fn(),
	resetKeychainValue: jest.fn(),
	getKeychainValue: jest.fn(),
	getAllKeychainKeys: jest.fn(),
	setSessionSecret: jest.fn(),
	getSessionSecret: jest.fn(),
	resetSessionSecret: jest.fn(),
	resetPubkySessionSecrets: jest.fn(),
	wipeKeychain: jest.fn(),
}));

const setKeychainValueMock = setKeychainValue as jest.MockedFunction<typeof setKeychainValue>;
const resetKeychainValueMock = resetKeychainValue as jest.MockedFunction<typeof resetKeychainValue>;
const resetPubkySessionSecretsMock = resetPubkySessionSecrets as jest.MockedFunction<
	typeof resetPubkySessionSecrets
>;
const wipeKeychainMock = wipeKeychain as jest.MockedFunction<typeof wipeKeychain>;

const deferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void } => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(res => {
		resolve = res;
	});
	return { promise, resolve };
};

const dispatch = jest.fn();

describe('H7 awaited keychain', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resetKeychainValueMock.mockResolvedValue(ok(true));
		resetPubkySessionSecretsMock.mockResolvedValue(ok(true));
		wipeKeychainMock.mockResolvedValue(undefined);
	});

	it('does not resolve savePubky until the keychain write finishes', async () => {
		const write = deferred<ReturnType<typeof ok<string>>>();
		setKeychainValueMock.mockReturnValue(write.promise);

		let settled = false;
		const pending = savePubky({
			secretKey: 'secret-key',
			pubky: 'test-pubky',
			dispatch,
		}).then(result => {
			settled = true;
			return result;
		});

		await Promise.resolve();
		expect(settled).toBe(false);
		expect(dispatch).not.toHaveBeenCalled();

		write.resolve(ok('secret-key'));
		const result = await pending;

		expect(result.isOk()).toBe(true);
		expect(setKeychainValueMock).toHaveBeenCalledWith({
			key: 'test-pubky',
			value: JSON.stringify({ secretKey: 'secret-key', mnemonic: '' }),
		});
		expect(dispatch).toHaveBeenCalledWith(
			addPubky({
				pubky: 'test-pubky',
				backupPreference: EBackupPreference.encryptedFile,
				isBackedUp: false,
				signupToken: '',
			}),
		);
	});

	it('does not add a pubky when the keychain write fails', async () => {
		setKeychainValueMock.mockResolvedValue(err('disk full'));

		const result = await savePubky({
			secretKey: 'secret-key',
			pubky: 'test-pubky',
			dispatch,
		});

		expect(result.isErr()).toBe(true);
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('does not resolve deletePubky until keychain wipes finish', async () => {
		const reset = deferred<ReturnType<typeof ok<boolean>>>();
		const sessions = deferred<ReturnType<typeof ok<boolean>>>();
		resetKeychainValueMock.mockReturnValue(reset.promise);
		resetPubkySessionSecretsMock.mockReturnValue(sessions.promise);

		let settled = false;
		const pending = deletePubky('test-pubky', dispatch).then(result => {
			settled = true;
			return result;
		});

		await Promise.resolve();
		expect(settled).toBe(false);
		expect(dispatch).not.toHaveBeenCalled();

		reset.resolve(ok(true));
		sessions.resolve(ok(true));
		const result = await pending;

		expect(result.isOk()).toBe(true);
		expect(resetKeychainValueMock).toHaveBeenCalledWith({ key: 'test-pubky' });
		expect(resetPubkySessionSecretsMock).toHaveBeenCalledWith({ pubky: 'test-pubky' });
		expect(dispatch).toHaveBeenCalledWith(removePubky('test-pubky'));
	});

	it('keeps the pubky in redux when keychain delete fails', async () => {
		resetKeychainValueMock.mockResolvedValue(err('locked'));

		const result = await deletePubky('test-pubky', dispatch);

		expect(result.isErr()).toBe(true);
		expect(dispatch).not.toHaveBeenCalled();
	});

	it('does not reset app state until wipeKeychain finishes', async () => {
		const wipe = deferred<void>();
		wipeKeychainMock.mockReturnValue(wipe.promise);

		let settled = false;
		const pending = wipeRingCustody(dispatch).then(() => {
			settled = true;
		});

		await Promise.resolve();
		expect(settled).toBe(false);
		expect(dispatch).not.toHaveBeenCalled();

		wipe.resolve(undefined);
		await pending;

		expect(wipeKeychainMock).toHaveBeenCalled();
		expect(dispatch).toHaveBeenNthCalledWith(1, resetSettings());
		expect(dispatch).toHaveBeenNthCalledWith(2, resetPubkys());
	});
});
