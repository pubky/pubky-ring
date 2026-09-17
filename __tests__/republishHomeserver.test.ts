import { ok, err } from '@synonymdev/result';
import { auth, republishHomeserver as nativeRepublishHomeserver } from '@synonymdev/react-native-pubky';
import { performAuth, republishAllHomeserverRecords } from '../src/utils/pubky';
import { getKeychainValue } from '../src/utils/keychain';
import { setHomeserver } from '../src/store/slices/pubkysSlice';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';
import {
	BITKIT_SOURCE_APP,
	SHARED_PUBKY_PROTOCOL_VERSION,
	getSharedPubkyCredential,
} from '../src/utils/sharedPubky';
import { EBackupPreference, Pubky, TPubkys } from '../src/types/pubky';

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

jest.mock('../src/utils/keychain', () => {
	// A borrowed identity whose credential is gone is disconnected before the error is returned,
	// and that clears its session secrets.
	const { ok: okResult } = jest.requireActual('@synonymdev/result');
	return {
		__esModule: true,
		getKeychainValue: jest.fn(),
		resetPubkySessionSecrets: jest.fn(async () => okResult(true)),
	};
});

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

// Only the native bridge is faked: the source-app constants and the lifecycle gate stay real.
jest.mock('../src/utils/sharedPubky', () => ({
	...jest.requireActual('../src/utils/sharedPubky'),
	getSharedPubkyCredential: jest.fn(),
}));

// pubky.ts now dispatches to the singleton store when a borrowed identity's credential is gone,
// so the real store (and its ESM-only dependencies) must stay out of this suite.
jest.mock('../src/store', () => ({
	__esModule: true,
	store: { dispatch: jest.fn() },
}));

const nativeRepublishHomeserverMock = nativeRepublishHomeserver as jest.MockedFunction<
	typeof nativeRepublishHomeserver
>;
const getKeychainValueMock = getKeychainValue as jest.MockedFunction<typeof getKeychainValue>;
const authMock = auth as jest.MockedFunction<typeof auth>;
const getPubkyDataFromStoreMock = getPubkyDataFromStore as jest.MockedFunction<typeof getPubkyDataFromStore>;
const getSharedPubkyCredentialMock = getSharedPubkyCredential as jest.MockedFunction<
	typeof getSharedPubkyCredential
>;

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

	it('never republishes a borrowed identity', async () => {
		const pubkys = createPubkys();
		pubkys.pubkyThree.sourceApp = 'to.bitkit';

		const summary = await republishAllHomeserverRecords({ pubkys, dispatch });

		expect(summary).toEqual({
			total: 3,
			succeeded: 1,
			failed: 0,
			skipped: 2,
		});
		expect(nativeRepublishHomeserverMock).toHaveBeenCalledTimes(1);
		expect(nativeRepublishHomeserverMock).toHaveBeenCalledWith('pubkyOne-secret', 'pubky://homeserver-one');
		expect(getKeychainValueMock).not.toHaveBeenCalledWith({ key: 'pubkyThree' });
		expect(dispatch).not.toHaveBeenCalledWith(
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

describe('performAuth', () => {
	const dispatch = jest.fn();
	const authUrl = 'pubkyauth:///?relay=https://relay.example';

	const createPubky = (sourceApp: Pubky['sourceApp']): Pubky => ({
		name: '',
		homeserver: 'pubky://homeserver-one',
		signedUp: true,
		signupToken: '',
		image: '',
		sessions: [],
		backupPreference: EBackupPreference.encryptedFile,
		isBackedUp: true,
		sourceApp,
	});

	beforeEach(() => {
		jest.clearAllMocks();
		// The auth timeout races a 20s timer that is never meant to win here.
		jest.useFakeTimers();
		jest.spyOn(console, 'log').mockImplementation(() => undefined);
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		getKeychainValueMock.mockImplementation(async ({ key }) =>
			ok(JSON.stringify({ secretKey: `${key}-secret`, mnemonic: '' })),
		);
		getSharedPubkyCredentialMock.mockResolvedValue({
			version: SHARED_PUBKY_PROTOCOL_VERSION,
			sourceApp: BITKIT_SOURCE_APP,
			pubky: 'borrowedPubky',
			secretKey: 'borrowedPubky-secret',
		});
		nativeRepublishHomeserverMock.mockResolvedValue(ok('Homeserver republished successfully'));
		authMock.mockResolvedValue(ok(['session-token']));
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('republishes an owned identity after authorising', async () => {
		getPubkyDataFromStoreMock.mockReturnValue(createPubky('app.pubkyring'));

		await expect(performAuth({ pubky: 'ownedPubky', authUrl, dispatch })).resolves.toEqual(ok('success'));

		expect(nativeRepublishHomeserverMock).toHaveBeenCalledWith('ownedPubky-secret', 'pubky://homeserver-one');
	});

	it('never republishes a borrowed identity after authorising', async () => {
		getPubkyDataFromStoreMock.mockReturnValue(createPubky('to.bitkit'));

		await expect(performAuth({ pubky: 'borrowedPubky', authUrl, dispatch })).resolves.toEqual(ok('success'));

		expect(authMock).toHaveBeenCalledWith(authUrl, 'borrowedPubky-secret');
		expect(nativeRepublishHomeserverMock).not.toHaveBeenCalled();
	});

	it('explains that a borrowed identity is no longer shared when its credential is gone', async () => {
		getPubkyDataFromStoreMock.mockReturnValue(createPubky('to.bitkit'));
		getSharedPubkyCredentialMock.mockResolvedValue(undefined);

		await expect(performAuth({ pubky: 'borrowedPubky', authUrl, dispatch })).resolves.toEqual(
			err('reuseSharedPubky.noLongerShared'),
		);
		// Nothing is signed with a key Ring no longer has.
		expect(authMock).not.toHaveBeenCalled();
	});

	it('keeps the generic secret key message for an owned identity', async () => {
		getPubkyDataFromStoreMock.mockReturnValue(createPubky('app.pubkyring'));
		getKeychainValueMock.mockResolvedValue(err('keychain locked'));

		await expect(performAuth({ pubky: 'ownedPubky', authUrl, dispatch })).resolves.toEqual(
			err('pubkyErrors.failedToGetSecretKey'),
		);
	});
});
