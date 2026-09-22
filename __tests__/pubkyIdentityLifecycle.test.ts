import { err, ok } from '@synonymdev/result';
import { getHomeserver, republishHomeserver, signIn, signUp } from '@synonymdev/react-native-pubky';
import { showToast } from '@synonymdev/react-native-toast';
import { EBackupPreference, Pubky } from '../src/types/pubky';
import {
	connectSharedPubky,
	deletePubky,
	disconnectBorrowedPubky,
	getPubkySecretKey,
	reconcileOwnedSharedPubkys,
	removeKeylessPubkys,
	restorePubkys,
	savePubky,
	signInToHomeserver,
	signUpToHomeserver,
	wipePubkyRingData,
} from '../src/utils/pubky';
import { getSharedPubkyCredential } from '../src/utils/sharedPubky';

const OWNED = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
const SECRET = '0123456789abcdef'.repeat(4);

const mockGetPublicKeyFromSecretKey = jest.fn();
const mockGetKeychainValue = jest.fn();
const mockSetKeychainValue = jest.fn();
const mockResetKeychainValue = jest.fn();
const mockResetPubkySessionSecrets = jest.fn();
const mockWipeKeychain = jest.fn();
const mockSetSessionSecret = jest.fn();
const mockGetAllKeychainKeys = jest.fn();
const mockGetPubkyDataFromStore = jest.fn();
const mockMirrorSharedPubky = jest.fn();
const mockRemoveSharedPubky = jest.fn();
const mockReconcileSharedPubkys = jest.fn();
const mockClearOwnedSharedPubkys = jest.fn();
const mockRemoveDisconnectedPubkyDetail = jest.fn();

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
	setSessionSecret: (...args: unknown[]) => mockSetSessionSecret(...args),
	wipeKeychain: (...args: unknown[]) => mockWipeKeychain(...args),
}));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({
	removeDisconnectedPubkyDetail: (...args: unknown[]) => mockRemoveDisconnectedPubkyDetail(...args),
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
		clearOwnedSharedPubkys: (...args: unknown[]) => mockClearOwnedSharedPubkys(...args),
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
	mockWipeKeychain.mockResolvedValue(true);
	mockSetSessionSecret.mockResolvedValue(ok(true));
	mockGetAllKeychainKeys.mockResolvedValue([]);
	mockGetPubkyDataFromStore.mockReturnValue(undefined);
	mockMirrorSharedPubky.mockResolvedValue(true);
	mockRemoveSharedPubky.mockResolvedValue(true);
	mockReconcileSharedPubkys.mockResolvedValue(true);
	mockClearOwnedSharedPubkys.mockResolvedValue(true);
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

test.each([
	{
		importedPubky: `pubky${OWNED}`,
		privateRecordKey: `pubky${OWNED}`,
		storedPubkyKey: `pubky${OWNED}`,
	},
	{ importedPubky: OWNED, privateRecordKey: `pubky${OWNED}`, storedPubkyKey: `pubky${OWNED}` },
	{ importedPubky: OWNED, privateRecordKey: OWNED, storedPubkyKey: `pk:${OWNED}` },
])(
	're-imports $importedPubky without changing its persisted Redux key $storedPubkyKey',
	async ({ importedPubky, privateRecordKey, storedPubkyKey }) => {
		mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
			pubky === storedPubkyKey ? ringPubky() : undefined,
		);
		mockGetAllKeychainKeys.mockResolvedValue([privateRecordKey]);
		const dispatch = jest.fn();

		const result = await savePubky({
			secretKey: SECRET,
			pubky: importedPubky,
			dispatch,
			isBackedUp: true,
			backupPreference: EBackupPreference.encryptedFile,
		});

		expect(result.isOk()).toBe(true);
		expect(mockSetKeychainValue).toHaveBeenCalledWith({
			key: privateRecordKey,
			value: JSON.stringify({ secretKey: SECRET, mnemonic: '' }),
		});
		expect(mockGetKeychainValue).toHaveBeenLastCalledWith({ key: privateRecordKey });
		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'pubky/setPubkyData',
				payload: expect.objectContaining({ pubky: storedPubkyKey }),
			}),
		);
		expect(mockMirrorSharedPubky).toHaveBeenCalledWith(OWNED, SECRET);
	},
);

test('restores an existing prefixed private record when re-import verification fails', async () => {
	const storedPubkyKey = `pubky${OWNED}`;
	const previousRecord = JSON.stringify({ secretKey: SECRET, mnemonic: 'previous mnemonic' });
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === storedPubkyKey ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([storedPubkyKey]);
	mockGetKeychainValue
		.mockResolvedValueOnce(ok(previousRecord))
		.mockResolvedValueOnce(err(new Error('read failed')));
	const dispatch = jest.fn();

	const result = await savePubky({ secretKey: SECRET, pubky: storedPubkyKey, dispatch });

	expect(result.isErr()).toBe(true);
	expect(mockSetKeychainValue).toHaveBeenLastCalledWith({
		key: storedPubkyKey,
		value: previousRecord,
	});
	expect(mockResetKeychainValue).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('reads a pk-prefixed Ring identity from its canonical private service', async () => {
	const storedPubkyKey = `pk:${OWNED}`;
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === storedPubkyKey ? ringPubky() : undefined,
	);

	const result = await getPubkySecretKey(storedPubkyKey);

	expect(result.isOk()).toBe(true);
	expect(mockGetKeychainValue).toHaveBeenCalledWith({ key: OWNED });
});

test('closes identity routes after a credential-driven disconnect removes the borrowed identity', async () => {
	mockGetPubkyDataFromStore.mockReturnValue({ ...ringPubky(), sourceApp: 'to.bitkit' });
	getSharedPubkyCredentialMock.mockResolvedValue(undefined);

	const result = await getPubkySecretKey(OWNED);

	expect(result.isErr()).toBe(true);
	expect(mockRemoveDisconnectedPubkyDetail).toHaveBeenCalledWith(OWNED);
});

test('keeps identity routes when a racing flow makes the credential-driven disconnect a no-op', async () => {
	mockGetPubkyDataFromStore
		.mockReturnValueOnce({ ...ringPubky(), sourceApp: 'to.bitkit' })
		.mockReturnValue(ringPubky());
	getSharedPubkyCredentialMock.mockResolvedValue(undefined);

	const result = await getPubkySecretKey(OWNED);

	expect(result.isErr()).toBe(true);
	expect(mockRemoveDisconnectedPubkyDetail).not.toHaveBeenCalled();
});

test('restores a legacy private service into its existing prefixed Redux identity', async () => {
	const storedPubkyKey = `pubky${OWNED}`;
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === storedPubkyKey ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([storedPubkyKey]);
	const dispatch = jest.fn();

	await expect(restorePubkys(dispatch)).resolves.toEqual([storedPubkyKey]);

	expect(mockSetKeychainValue).toHaveBeenCalledWith(expect.objectContaining({ key: storedPubkyKey }));
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({
			type: 'pubky/setPubkyData',
			payload: expect.objectContaining({ pubky: storedPubkyKey }),
		}),
	);
	expect(dispatch).not.toHaveBeenCalledWith(
		expect.objectContaining({
			type: 'pubky/addPubky',
			payload: expect.objectContaining({ pubky: OWNED }),
		}),
	);
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

test('does not prune shared mirrors after private enumeration fails', async () => {
	mockGetAllKeychainKeys.mockRejectedValue(new Error('temporarily unavailable'));

	await expect(reconcileOwnedSharedPubkys()).resolves.toBe(false);
	expect(mockGetKeychainValue).not.toHaveBeenCalled();
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

test('deletes the canonical record for a pk-prefixed Redux identity last', async () => {
	const storedPubkyKey = `pk:${OWNED}`;
	mockGetPubkyDataFromStore.mockImplementation((pubky: string) =>
		pubky === storedPubkyKey ? ringPubky() : undefined,
	);
	mockGetAllKeychainKeys.mockResolvedValue([OWNED, `pubky${OWNED}`]);
	mockResetKeychainValue.mockImplementation(async ({ key }: { key: string }) =>
		key === OWNED ? ok(true) : err(new Error('keychain locked')),
	);
	const dispatch = jest.fn();

	const result = await deletePubky(storedPubkyKey, dispatch);

	expect(result.isErr()).toBe(true);
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

	// Reports the removal so the caller can explain it exactly once.
	await expect(disconnectBorrowedPubky(OWNED, dispatch)).resolves.toBe(true);

	expect(mockResetPubkySessionSecrets).toHaveBeenCalledWith({ pubky: OWNED });
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/removePubky', payload: OWNED }),
	);
});

test('never disconnects an identity that is no longer borrowed', async () => {
	// A concurrent flow may have removed the identity or replaced it with a Ring-owned one.
	mockGetPubkyDataFromStore.mockReturnValue(ringPubky());
	const dispatch = jest.fn();

	// Reports that it removed nothing, so a racing caller stays quiet.
	await expect(disconnectBorrowedPubky(OWNED, dispatch)).resolves.toBe(false);

	expect(mockResetPubkySessionSecrets).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('refuses authorization without dropping a borrowed identity after a temporary credential failure', async () => {
	mockGetPubkyDataFromStore.mockReturnValue({ ...ringPubky(), sourceApp: 'to.bitkit' });
	getSharedPubkyCredentialMock.mockRejectedValueOnce(new Error('keychain temporarily locked'));
	const result = await getPubkySecretKey(OWNED);
	expect(result.isErr()).toBe(true);
	expect(mockResetPubkySessionSecrets).not.toHaveBeenCalled();
	expect(mockRemoveDisconnectedPubkyDetail).not.toHaveBeenCalled();
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

test('connects a Bitkit identity whose homeserver record cannot be resolved', async () => {
	// Nothing resolvable means the connect flow has no homeserver to hand to sign-in, and signing in
	// does not need one: it resolves the homeserver from the key itself.
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
	getHomeserverMock.mockResolvedValue(err(new Error('No homeserver found')));
	signInMock.mockResolvedValue(ok({ pubky: OWNED, capabilities: ['/pub/:rw'], grant_secret: 'grant' }));

	const result = await connectSharedPubky({
		identity: { ...bitkitIdentity, pubky: OWNED },
		dispatch,
	});

	expect(result.isOk()).toBe(true);
	expect(signInMock).toHaveBeenCalled();
	expect(republishHomeserverMock).not.toHaveBeenCalled();
	// Only a genuinely resolved homeserver is stored; the sign-in fallback is never persisted.
	expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/setHomeserver' }));
	expect(dispatch).toHaveBeenCalledWith(
		expect.objectContaining({ type: 'pubky/addPubky', payload: expect.objectContaining({ pubky: OWNED }) }),
	);
});

test('never republishes a borrowed identity connected without a homeserver record', async () => {
	// Sign-in receives a fallback homeserver so the connect can proceed, and a failed sign-in falls
	// back to republishing. That fallback must never be signed into the owner's pkarr record.
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
	getHomeserverMock.mockResolvedValue(ok(''));
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

test('never falls back to the default homeserver for a Ring-owned identity stored without one', async () => {
	// A failed sign-in republishes the homeserver it was given. Substituting the default for an
	// owned key's empty record would let that recovery path re-home the identity.
	mockGetPubkyDataFromStore.mockReturnValue(ringPubky());
	signInMock.mockResolvedValue(err(new Error('homeserver unavailable')));
	republishHomeserverMock.mockResolvedValue(ok('republished'));
	const dispatch = jest.fn();

	const result = await signInToHomeserver({ pubky: OWNED, secretKey: SECRET, dispatch });

	expect(result.isErr()).toBe(true);
	expect(signInMock).not.toHaveBeenCalled();
	expect(republishHomeserverMock).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('drops only the identities a partial wipe left without a private key', async () => {
	// A wipe deletes records in parallel, so a failure can leave some keys already destroyed.
	const SURVIVOR = 'o4dksfbqk85ogzdb5osziw6befigbuxmuxkuxq8434q89uj56uyy';
	mockGetAllKeychainKeys.mockResolvedValue([SURVIVOR, `pubky-session:${OWNED}:session-id`]);
	const dispatch = jest.fn();

	await removeKeylessPubkys({ ownedPubkys: [OWNED, SURVIVOR], dispatch });

	expect(dispatch).toHaveBeenCalledTimes(1);
	expect(dispatch).toHaveBeenCalledWith({ type: 'pubky/removePubky', payload: OWNED });
});

test('keeps a pk-prefixed Redux identity when its canonical service survives a partial wipe', async () => {
	const storedPubkyKey = `pk:${OWNED}`;
	mockGetAllKeychainKeys.mockResolvedValue([OWNED]);
	const dispatch = jest.fn();

	await removeKeylessPubkys({ ownedPubkys: [storedPubkyKey], dispatch });

	expect(dispatch).not.toHaveBeenCalled();
});

test('keeps every identity listed when the keychain cannot be read after a partial wipe', async () => {
	mockGetAllKeychainKeys.mockRejectedValue(new Error('keychain unavailable'));
	const dispatch = jest.fn();

	await removeKeylessPubkys({ ownedPubkys: [OWNED], dispatch });

	expect(dispatch).not.toHaveBeenCalled();
});

test('clears persisted identities when final shared wipe verification fails', async () => {
	mockClearOwnedSharedPubkys.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
	mockGetAllKeychainKeys.mockResolvedValue([]);
	const dispatch = jest.fn();

	await expect(wipePubkyRingData([OWNED], dispatch)).resolves.toBe(false);

	expect(mockWipeKeychain).toHaveBeenCalledTimes(1);
	expect(dispatch).toHaveBeenCalledWith({ type: 'pubky/removePubky', payload: OWNED });
	expect(mockClearOwnedSharedPubkys).toHaveBeenCalledTimes(2);
});

test('preserves private and persisted identities when initial shared wipe fails', async () => {
	mockClearOwnedSharedPubkys.mockResolvedValue(false);
	const dispatch = jest.fn();

	await expect(wipePubkyRingData([OWNED], dispatch)).resolves.toBe(false);

	expect(mockWipeKeychain).not.toHaveBeenCalled();
	expect(dispatch).not.toHaveBeenCalled();
});

test('skips final shared verification when the private wipe fails', async () => {
	const SURVIVOR = 'o4dksfbqk85ogzdb5osziw6befigbuxmuxkuxq8434q89uj56uyy';
	mockWipeKeychain.mockResolvedValue(false);
	mockGetAllKeychainKeys.mockResolvedValue([SURVIVOR]);
	const dispatch = jest.fn();

	await expect(wipePubkyRingData([OWNED, SURVIVOR], dispatch)).resolves.toBe(false);

	expect(mockClearOwnedSharedPubkys).toHaveBeenCalledTimes(1);
	expect(dispatch).toHaveBeenCalledTimes(1);
	expect(dispatch).toHaveBeenCalledWith({ type: 'pubky/removePubky', payload: OWNED });
});

test('preserves identities when keychain enumeration fails after final shared verification', async () => {
	mockClearOwnedSharedPubkys.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
	mockGetAllKeychainKeys.mockRejectedValue(new Error('keychain unavailable'));
	const dispatch = jest.fn();

	await expect(wipePubkyRingData([OWNED], dispatch)).resolves.toBe(false);

	expect(dispatch).not.toHaveBeenCalled();
});

test('accepts a fully verified wipe without failure reconciliation', async () => {
	const dispatch = jest.fn();

	await expect(wipePubkyRingData([OWNED], dispatch)).resolves.toBe(true);

	expect(mockWipeKeychain).toHaveBeenCalledTimes(1);
	expect(mockClearOwnedSharedPubkys).toHaveBeenCalledTimes(2);
	expect(dispatch).not.toHaveBeenCalled();
});
