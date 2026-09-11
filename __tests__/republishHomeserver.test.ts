import { ok, err } from '@synonymdev/result';
import { republishHomeserver as nativeRepublishHomeserver } from '@synonymdev/react-native-pubky';
import { republishAllHomeserverRecords } from '../src/utils/pubky';
import { getKeychainValue } from '../src/utils/keychain';
import { setHomeserver } from '../src/store/slices/pubkysSlice';
import { EBackupPreference, TPubkys } from '../src/types/pubky';

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

jest.mock('../src/utils/keychain', () => ({
	__esModule: true,
	getKeychainValue: jest.fn(),
}));

jest.mock('../src/utils/helpers.ts', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(async () => true),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	addProcessing: jest.fn(payload => ({ type: 'pubky/addProcessing', payload })),
	addPubky: jest.fn(payload => ({ type: 'pubky/addPubky', payload })),
	addSession: jest.fn(payload => ({ type: 'pubky/addSession', payload })),
	removeProcessing: jest.fn(payload => ({ type: 'pubky/removeProcessing', payload })),
	removePubky: jest.fn(payload => ({ type: 'pubky/removePubky', payload })),
	removeSession: jest.fn(payload => ({ type: 'pubky/removeSession', payload })),
	setHomeserver: jest.fn(payload => ({ type: 'pubky/setHomeserver', payload })),
	setPubkyData: jest.fn(payload => ({ type: 'pubky/setPubkyData', payload })),
	setSignedUp: jest.fn(payload => ({ type: 'pubky/setSignedUp', payload })),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getPubkyDataFromStore: jest.fn(),
}));

const nativeRepublishHomeserverMock = nativeRepublishHomeserver as jest.MockedFunction<
	typeof nativeRepublishHomeserver
>;
const getKeychainValueMock = getKeychainValue as jest.MockedFunction<typeof getKeychainValue>;

const createPubkys = (): TPubkys => ({
	pubkyOne: {
		name: '',
		homeserver: 'pubky://homeserver-one',
		signedUp: true,
		signupToken: '',
		image: '',
		sessions: [],
		backupPreference: EBackupPreference.encryptedFile,
		isBackedUp: true,
	},
	pubkyTwo: {
		name: '',
		homeserver: '',
		signedUp: false,
		signupToken: '',
		image: '',
		sessions: [],
		backupPreference: EBackupPreference.encryptedFile,
		isBackedUp: true,
	},
	pubkyThree: {
		name: '',
		homeserver: 'pubky://homeserver-three',
		signedUp: true,
		signupToken: '',
		image: '',
		sessions: [],
		backupPreference: EBackupPreference.encryptedFile,
		isBackedUp: true,
	},
});

describe('republishAllHomeserverRecords', () => {
	const dispatch = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'log').mockImplementation(() => undefined);
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		getKeychainValueMock.mockImplementation(async ({ key }) =>
			ok(JSON.stringify({ secretKey: `${key}-secret`, mnemonic: '' })),
		);
		nativeRepublishHomeserverMock.mockResolvedValue(ok('Homeserver republished successfully'));
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('republishes keys with homeservers and skips keys without one', async () => {
		const summary = await republishAllHomeserverRecords({
			pubkys: createPubkys(),
			dispatch,
		});

		expect(summary).toEqual({
			total: 3,
			succeeded: 2,
			failed: 0,
			skipped: 1,
		});
		expect(nativeRepublishHomeserverMock).toHaveBeenCalledTimes(2);
		expect(nativeRepublishHomeserverMock).toHaveBeenNthCalledWith(
			1,
			'pubkyOne-secret',
			'pubky://homeserver-one',
		);
		expect(nativeRepublishHomeserverMock).toHaveBeenNthCalledWith(
			2,
			'pubkyThree-secret',
			'pubky://homeserver-three',
		);
		expect(dispatch).toHaveBeenCalledWith(
			setHomeserver({ pubky: 'pubkyOne', homeserver: 'pubky://homeserver-one' }),
		);
		expect(dispatch).toHaveBeenCalledWith(
			setHomeserver({ pubky: 'pubkyThree', homeserver: 'pubky://homeserver-three' }),
		);
	});

	it('continues republishing after a key fails', async () => {
		nativeRepublishHomeserverMock
			.mockResolvedValueOnce(err('relay rate limited'))
			.mockResolvedValueOnce(ok('Homeserver republished successfully'));

		const summary = await republishAllHomeserverRecords({
			pubkys: createPubkys(),
			dispatch,
		});

		expect(summary).toEqual({
			total: 3,
			succeeded: 1,
			failed: 1,
			skipped: 1,
		});
		expect(nativeRepublishHomeserverMock).toHaveBeenCalledTimes(2);
		expect(console.error).toHaveBeenCalledWith(
			'[republish] Batch item failed for pubkyOne:',
			'relay rate limited',
		);
	});

	it('starts republishing all keys in parallel', async () => {
		let resolveFirst: (value: ReturnType<typeof ok<string>>) => void = jest.fn();
		let resolveSecond: (value: ReturnType<typeof ok<string>>) => void = jest.fn();
		const firstRepublish = new Promise<ReturnType<typeof ok<string>>>(resolve => {
			resolveFirst = resolve;
		});
		const secondRepublish = new Promise<ReturnType<typeof ok<string>>>(resolve => {
			resolveSecond = resolve;
		});

		nativeRepublishHomeserverMock.mockReturnValueOnce(firstRepublish).mockReturnValueOnce(secondRepublish);

		const summaryPromise = republishAllHomeserverRecords({
			pubkys: createPubkys(),
			dispatch,
		});

		await Promise.resolve();
		await Promise.resolve();

		expect(nativeRepublishHomeserverMock).toHaveBeenCalledTimes(2);

		resolveFirst(ok('Homeserver republished successfully'));
		resolveSecond(ok('Homeserver republished successfully'));

		await expect(summaryPromise).resolves.toEqual({
			total: 3,
			succeeded: 2,
			failed: 0,
			skipped: 1,
		});
	});
});
