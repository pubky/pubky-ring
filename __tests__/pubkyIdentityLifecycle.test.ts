import { err, ok } from '@synonymdev/result';
import { getHomeserver, republishHomeserver, signIn, signUp } from '@synonymdev/react-native-pubky';
import { showToast } from '@synonymdev/react-native-toast';
import { EBackupPreference, Pubky } from '../src/types/pubky';
import {
	connectSharedPubky,
	deletePubky,
	disconnectBorrowedPubky,
	reconcileOwnedSharedPubkys,
	savePubky,
	signUpToHomeserver,
} from '../src/utils/pubky';
import { getSharedPubkyCredential } from '../src/utils/sharedPubky';

const OWNED = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
const SECRET = '0123456789abcdef'.repeat(4);

const mockGetPublicKeyFromSecretKey = jest.fn();
const mockGetKeychainValue = jest.fn();
const mockSetKeychainValue = jest.fn();
const mockResetKeychainValue = jest.fn();
const mockResetPubkySessionSecrets = jest.fn();
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

jest.mock('uuid', () => ({
	__esModule: true,
	v5: jest.fn(() => 'session-id'),
}));

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
	resetPubkySessionSecrets: (...args: unknown[]) => mockResetPubkySessionSecrets(...args),
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
		isValidSharedSecretKey: (value: unknown) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value),
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

const bitkitIdentity = { version: 1, sourceApp: 'to.bitkit' } as const;

const getHomeserverMock = getHomeserver as jest.MockedFunction<typeof getHomeserver>;
const republishHomeserverMock = republishHomeserver as jest.MockedFunction<typeof republishHomeserver>;
const signInMock = signIn as jest.MockedFunction<typeof signIn>;
const signUpMock = signUp as jest.MockedFunction<typeof signUp>;
const showToastMock = showToast as jest.MockedFunction<typeof showToast>;
const getSharedPubkyCredentialMock = getSharedPubkyCredential as jest.MockedFunction<
	typeof getSharedPubkyCredential
>;

beforeEach(() => {
	jest.clearAllMocks();
	mockGetPublicKeyFromSecretKey.mockResolvedValue(ok({ public_key: OWNED }));
	mockGetKeychainValue.mockResolvedValue(ok(JSON.stringify({ secretKey: SECRET, mnemonic: '' })));
	mockSetKeychainValue.mockResolvedValue(ok('saved'));
	mockResetKeychainValue.mockResolvedValue(ok(true));
	mockResetPubkySessionSecrets.mockResolvedValue(ok(true));
	mockGetAllKeychainKeys.mockResolvedValue([]);
	mockGetPubkyDataFromStore.mockReturnValue(undefined);
	mockMirrorSharedPubky.mockResolvedValue(true);
	mockRemoveSharedPubky.mockResolvedValue(true);
	mockReconcileSharedPubkys.mockResolvedValue(true);
});

test('re-imports an existing Ring identity instead of rejecting it as a duplicate', async () => {
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === OWNED ? ringPubky() : undefined,
	);
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
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === OWNED ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([OWNED, `pubky${OWNED}`]);
	const dispatch = jest.fn();

	const result = await deletePubky(`pk:${OWNED}`, dispatch);

	expect(result.isOk()).toBe(true);
	expect(mockRemoveSharedPubky).toHaveBeenCalledWith(OWNED);
	expect(mockResetPubkySessionSecrets).toHaveBeenCalledWith({ pubky: OWNED });
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
	// Ring-local session secrets are the one piece of private state a disconnect must clear.
	expect(mockResetPubkySessionSecrets).toHaveBeenCalledWith({ pubky: OWNED });
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
});

test('keeps session secrets revocable when deleting the private record fails', async () => {
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === OWNED ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([OWNED]);
	mockResetKeychainValue.mockResolvedValue(err(new Error('keychain locked')));
	const dispatch = jest.fn();

	const result = await deletePubky(OWNED, dispatch);

	expect(result.isErr()).toBe(true);
	// The identity survives the aborted delete, so its homeserver grants must still be revocable.
	expect(mockResetPubkySessionSecrets).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('deletes the record the read paths use last so a partial failure keeps a usable key', async () => {
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === OWNED ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([OWNED, `pubky${OWNED}`]);
	mockResetKeychainValue.mockImplementation(async ({ key }: { key: string }) =>
		key === OWNED ? ok(true) : err(new Error('keychain locked')),
	);
	const dispatch = jest.fn();

	const result = await deletePubky(OWNED, dispatch);

	expect(result.isErr()).toBe(true);
	// The identity stays listed, so the record stored under its Redux key must survive.
	expect(mockResetKeychainValue).toHaveBeenCalledTimes(1);
	expect(mockResetKeychainValue).toHaveBeenCalledWith({ key: `pubky${OWNED}` });
	expect(dispatch).not.toHaveBeenCalled();
});

test('removes the identity once its private key is gone even if session cleanup fails', async () => {
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === OWNED ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([OWNED]);
	mockResetPubkySessionSecrets.mockResolvedValue(err(new Error('keychain locked')));
	const dispatch = jest.fn();

	const result = await deletePubky(OWNED, dispatch);

	// The private key is irreversibly deleted, so a keyless identity must not stay listed.
	expect(mockResetKeychainValue).toHaveBeenCalledWith({ key: OWNED });
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
	expect(result.isOk()).toBe(true);
	expect(showToastMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
});

test('drops a borrowed reference along with its session secrets', async () => {
	mockGetPubkyDataFromStore.mockReturnValue({ ...ringPubky(), sourceApp: 'to.bitkit' });
	const dispatch = jest.fn();

	await disconnectBorrowedPubky(OWNED, dispatch);

	expect(mockResetPubkySessionSecrets).toHaveBeenCalledWith({ pubky: OWNED });
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
});

test('never disconnects an identity that is no longer borrowed', async () => {
	// A concurrent flow may have removed the identity or replaced it with a Ring-owned one.
	mockGetPubkyDataFromStore.mockReturnValue(ringPubky());
	const dispatch = jest.fn();

	await disconnectBorrowedPubky(OWNED, dispatch);

	expect(mockResetPubkySessionSecrets).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('never republishes a borrowed identity when its homeserver sign-in fails', async () => {
	// Connecting is the first thing Ring does with a borrowed key, and a failed sign-in falls back
	// to republishing. That would sign Ring's cached homeserver into the owner's pkarr record.
	let connected = false;
	const dispatch = jest.fn();
	dispatch.mockImplementation((action: { type: string }) => {
		if (action.type === 'pubky/addPubky') connected = true;
		if (action.type === 'pubky/removePubky') connected = false;
		return action;
	});
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		connected && pubky === OWNED ? { ...ringPubky(), sourceApp: 'to.bitkit' } : undefined,
	);
	getSharedPubkyCredentialMock.mockResolvedValue({
		...bitkitIdentity,
		pubky: OWNED,
		secretKey: SECRET,
	});
	getHomeserverMock.mockResolvedValue(ok('pubky://bitkit-homeserver'));
	signInMock.mockResolvedValue(err(new Error('homeserver unavailable')));
	republishHomeserverMock.mockResolvedValue(ok('republished'));

	const result = await connectSharedPubky({
		identity: { ...bitkitIdentity, pubky: OWNED },
		dispatch,
	});

	expect(result.isErr()).toBe(true);
	expect(republishHomeserverMock).not.toHaveBeenCalled();
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
});

test('never signs a borrowed identity up to a locally edited homeserver', async () => {
	// The edit sheet lets any identity's homeserver be changed, and signing up publishes a new
	// homeserver record for the key, which only the owning app may do.
	mockGetPubkyDataFromStore.mockReturnValue({ ...ringPubky(), sourceApp: 'to.bitkit' });
	// A readable credential, so that without the ownership gate the signup would go through.
	getSharedPubkyCredentialMock.mockResolvedValue({
		...bitkitIdentity,
		pubky: OWNED,
		secretKey: SECRET,
	});
	const dispatch = jest.fn();

	const result = await signUpToHomeserver({
		pubky: OWNED,
		homeserver: 'pubky://ring-edited-homeserver',
		dispatch,
	});

	expect(result.isErr()).toBe(true);
	expect(signUpMock).not.toHaveBeenCalled();
	expect(republishHomeserverMock).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});
