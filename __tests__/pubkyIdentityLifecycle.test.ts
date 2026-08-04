import { err, ok } from '@synonymdev/result';
import { EBackupPreference, Pubky } from '../src/types/pubky';
import { deletePubky, reconcileOwnedSharedPubkys, savePubky } from '../src/utils/pubky';

const OWNED = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
const SECRET = '0123456789abcdef'.repeat(4);

const mockGetPublicKeyFromSecretKey = jest.fn();
const mockGetKeychainValue = jest.fn();
const mockSetKeychainValue = jest.fn();
const mockResetKeychainValue = jest.fn();
const mockGetAllKeychainKeys = jest.fn();
const mockGetPubkyDataFromStore = jest.fn();
const mockMirrorSharedPubky = jest.fn();
const mockRemoveSharedPubky = jest.fn();
const mockReconcileSharedPubkys = jest.fn();

jest.mock('@synonymdev/react-native-pubky', () => ({
	auth: jest.fn(),
	generateMnemonicPhraseAndKeypair: jest.fn(),
	get: jest.fn(),
	getHomeserver: jest.fn(),
	getPublicKeyFromSecretKey: (...args: unknown[]) => mockGetPublicKeyFromSecretKey(...args),
	getSignupToken: jest.fn(),
	mnemonicPhraseToKeypair: jest.fn(),
	republishHomeserver: jest.fn(),
	signIn: jest.fn(),
	signOut: jest.fn(),
	signUp: jest.fn(),
}));

jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key },
}));

jest.mock('../src/store', () => ({ store: { dispatch: jest.fn() } }));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	addProcessing: (payload: unknown) => ({ type: 'pubky/addProcessing', payload }),
	addPubky: (payload: unknown) => ({ type: 'pubky/addPubky', payload }),
	addSession: (payload: unknown) => ({ type: 'pubky/addSession', payload }),
	removeProcessing: (payload: unknown) => ({ type: 'pubky/removeProcessing', payload }),
	removePubky: (payload: unknown) => ({ type: 'pubky/removePubky', payload }),
	removeSession: (payload: unknown) => ({ type: 'pubky/removeSession', payload }),
	setHomeserver: (payload: unknown) => ({ type: 'pubky/setHomeserver', payload }),
	setPubkyData: (payload: unknown) => ({ type: 'pubky/setPubkyData', payload }),
	setSignedUp: (payload: unknown) => ({ type: 'pubky/setSignedUp', payload }),
}));

jest.mock('../src/utils/helpers.ts', () => ({ checkNetworkConnection: jest.fn() }));

jest.mock('../src/utils/store-helpers.ts', () => ({
	getPubkyDataFromStore: (...args: unknown[]) => mockGetPubkyDataFromStore(...args),
}));

jest.mock('../src/utils/keychain', () => ({
	getAllKeychainKeys: (...args: unknown[]) => mockGetAllKeychainKeys(...args),
	getKeychainValue: (...args: unknown[]) => mockGetKeychainValue(...args),
	resetKeychainValue: (...args: unknown[]) => mockResetKeychainValue(...args),
	setKeychainValue: (...args: unknown[]) => mockSetKeychainValue(...args),
}));

jest.mock('../src/utils/sharedPubky.ts', () => {
	const normalize = (value: unknown): string | undefined => {
		if (typeof value !== 'string') return undefined;
		const bare = value.startsWith('pubky') ? value.slice(5) : value;
		return /^[ybndrfg8ejkmcpqxot1uwisza345h769]{52}$/.test(bare) ? bare : undefined;
	};

	return {
		BITKIT_SOURCE_APP: 'to.bitkit',
		RING_SOURCE_APP: 'app.pubkyring',
		getSharedPubkyCredential: jest.fn(),
		isValidSharedSecretKey: (value: unknown) =>
			typeof value === 'string' && /^[0-9a-f]{64}$/.test(value),
		mirrorSharedPubky: (...args: unknown[]) => mockMirrorSharedPubky(...args),
		normalizeSharedPubky: normalize,
		privatePubkyService: (service: string) => {
			const pubky = normalize(service);
			return pubky ? { service, pubky } : undefined;
		},
		reconcileSharedPubkys: (...args: unknown[]) => mockReconcileSharedPubkys(...args),
		removeSharedPubky: (...args: unknown[]) => mockRemoveSharedPubky(...args),
		withPubkyIdentityLifecycle: (operation: () => Promise<unknown>) => operation(),
	};
});

const ringPubky = (): Pubky => ({
	name: '',
	homeserver: '',
	signedUp: false,
	signupToken: '',
	image: '',
	sessions: [],
	backupPreference: EBackupPreference.unknown,
	isBackedUp: false,
	sourceApp: 'app.pubkyring',
});

beforeEach(() => {
	jest.clearAllMocks();
	mockGetPublicKeyFromSecretKey.mockResolvedValue(ok({ public_key: OWNED }));
	mockGetKeychainValue.mockResolvedValue(ok(JSON.stringify({ secretKey: SECRET, mnemonic: '' })));
	mockSetKeychainValue.mockResolvedValue(ok('saved'));
	mockResetKeychainValue.mockResolvedValue(ok(true));
	mockGetAllKeychainKeys.mockResolvedValue([]);
	mockGetPubkyDataFromStore.mockReturnValue(undefined);
	mockMirrorSharedPubky.mockResolvedValue(true);
	mockRemoveSharedPubky.mockResolvedValue(true);
	mockReconcileSharedPubkys.mockResolvedValue(true);
});

test('re-imports an existing Ring identity instead of rejecting it as a duplicate', async () => {
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) => (pubky === OWNED ? ringPubky() : undefined));
	mockGetAllKeychainKeys.mockResolvedValue([OWNED]);
	const dispatch = jest.fn();

	const result = await savePubky({
		secretKey: SECRET,
		pubky: OWNED,
		dispatch,
		isBackedUp: true,
		backupPreference: EBackupPreference.encryptedFile,
	});

	expect(result.isOk()).toBe(true);
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({
			type: 'pubky/setPubkyData',
			payload: expect.objectContaining({ pubky: OWNED }),
		}),
	);
	expect(mockMirrorSharedPubky).toHaveBeenCalledWith(OWNED, SECRET);
});

test('never promotes a Bitkit-owned identity into Ring private storage', async () => {
	mockGetPubkyDataFromStore.mockReturnValue({ ...ringPubky(), sourceApp: 'to.bitkit' });
	const dispatch = jest.fn();

	const result = await savePubky({ secretKey: SECRET, pubky: OWNED, dispatch });

	expect(result.isErr()).toBe(true);
	expect(mockSetKeychainValue).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('rolls back a newly written private record when verification fails', async () => {
	mockGetKeychainValue.mockResolvedValue(err(new Error('read failed')));
	const dispatch = jest.fn();

	const result = await savePubky({ secretKey: SECRET, pubky: OWNED, dispatch });

	expect(result.isErr()).toBe(true);
	expect(mockResetKeychainValue).toHaveBeenCalledWith({ key: OWNED });
	expect(dispatch).not.toHaveBeenCalled();
});

test('does not prune shared mirrors after a private keychain read failure', async () => {
	mockGetAllKeychainKeys.mockResolvedValue([OWNED]);
	mockGetKeychainValue.mockResolvedValue(err(new Error('temporarily unavailable')));

	await expect(reconcileOwnedSharedPubkys()).resolves.toBe(false);
	expect(mockReconcileSharedPubkys).not.toHaveBeenCalled();
});

test('deletes every private service for a normalized identity before removing Redux state', async () => {
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) => (pubky === OWNED ? ringPubky() : undefined));
	mockGetAllKeychainKeys.mockResolvedValue([OWNED, `pubky${OWNED}`]);
	const dispatch = jest.fn();

	const result = await deletePubky(`pk:${OWNED}`, dispatch);

	expect(result.isOk()).toBe(true);
	expect(mockRemoveSharedPubky).toHaveBeenCalledWith(OWNED);
	expect(mockResetKeychainValue).toHaveBeenCalledTimes(2);
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
});

test('disconnects a Bitkit identity without deleting either key store', async () => {
	mockGetPubkyDataFromStore.mockReturnValue({ ...ringPubky(), sourceApp: 'to.bitkit' });
	const dispatch = jest.fn();

	const result = await deletePubky(OWNED, dispatch);

	expect(result.isOk()).toBe(true);
	expect(mockRemoveSharedPubky).not.toHaveBeenCalled();
	expect(mockResetKeychainValue).not.toHaveBeenCalled();
	expect(mockGetAllKeychainKeys).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
});
