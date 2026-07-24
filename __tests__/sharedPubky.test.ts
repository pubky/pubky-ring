import { NativeModules, Platform } from 'react-native';
import {
	BITKIT_SOURCE_APP,
	canonicalSharedPubky,
	clearOwnedSharedPubkys,
	discoverSharedPubkys,
	getPrivateKeychainAccessGroup,
	getSharedPubkyCredential,
	isValidSharedSecretKey,
	mirrorSharedPubky,
	normalizeSharedPubky,
	privatePubkyService,
	reconcileSharedPubkys,
	removeSharedPubky,
	withPubkyIdentityLifecycle,
} from '../src/utils/sharedPubky';
import { getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';

jest.mock('@synonymdev/react-native-pubky', () => ({
	getPublicKeyFromSecretKey: jest.fn(),
}));

const OWNED = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
const SHARED = '8um71us3fyw6h8wbcxb5ar3rwusy1a6u49956ikzojg3gcwd1dty';
const OTHER = '3rsduhcxpw74snwyct86m38c63j3pq8x4ycqikxg64roik8yw5xg';
const SECRET_A = '0123456789abcdef'.repeat(4);
const SECRET_B = 'abcdef0123456789'.repeat(4);
const derive = getPublicKeyFromSecretKey as jest.MockedFunction<typeof getPublicKeyFromSecretKey>;
const mirror = jest.fn();
const remove = jest.fn();
const reconcile = jest.fn();
const clear = jest.fn();
const list = jest.fn();
const credential = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
	NativeModules.SharedPubky = {
		privateAccessGroup: 'TEAM.app.pubkyring',
		mirror,
		remove,
		reconcile,
		clear,
		list,
		credential,
	};
});

test('normalizes only canonical raw or pubky-prefixed z-base32 public keys', () => {
	expect(normalizeSharedPubky(SHARED)).toBe(SHARED);
	expect(normalizeSharedPubky(`pubky${SHARED}`)).toBe(SHARED);
	expect(normalizeSharedPubky(`pk:${SHARED}`)).toBeUndefined();
	expect(normalizeSharedPubky(SHARED.toUpperCase())).toBeUndefined();
	expect(normalizeSharedPubky(`${SHARED.slice(0, 51)}0`)).toBeUndefined();
	expect(normalizeSharedPubky(SHARED.slice(0, 51))).toBeUndefined();
});

test('accepts only exact bare public keys at the shared wire boundary', () => {
	expect(canonicalSharedPubky(SHARED)).toBe(SHARED);
	expect(canonicalSharedPubky(`pubky${SHARED}`)).toBeUndefined();
	expect(canonicalSharedPubky(` ${SHARED}`)).toBeUndefined();
	expect(canonicalSharedPubky(`${SHARED} `)).toBeUndefined();
});

test('keeps the actual private service name separate from its canonical wire pubky', () => {
	expect(privatePubkyService(OWNED)).toEqual({ service: OWNED, pubky: OWNED });
	expect(privatePubkyService(`pubky${OWNED}`)).toEqual({
		service: `pubky${OWNED}`,
		pubky: OWNED,
	});
	expect(privatePubkyService(`pk:${OWNED}`)).toBeUndefined();
});

test('accepts only canonical lowercase 32-byte hex secret keys at the sharing boundary', async () => {
	expect(isValidSharedSecretKey(SECRET_A)).toBe(true);
	expect(isValidSharedSecretKey(SECRET_A.toUpperCase())).toBe(false);
	expect(isValidSharedSecretKey(SECRET_A.slice(0, 63))).toBe(false);
	expect(isValidSharedSecretKey(`${SECRET_A.slice(0, 63)}g`)).toBe(false);

	await expect(mirrorSharedPubky(OWNED, SECRET_A.toUpperCase())).resolves.toBe(false);
	await expect(reconcileSharedPubkys([{ pubky: OWNED, secretKey: 'secret' }])).resolves.toBe(false);
	expect(mirror).not.toHaveBeenCalled();
	expect(reconcile).not.toHaveBeenCalled();
});

test('publishes, reconciles, and removes only canonical source-owned values', async () => {
	mirror.mockResolvedValue(undefined);
	reconcile.mockResolvedValue(undefined);
	remove.mockResolvedValue(undefined);
	clear.mockResolvedValue(undefined);

	await expect(mirrorSharedPubky(`pubky${OWNED}`, SECRET_A)).resolves.toBe(true);
	await expect(reconcileSharedPubkys([{ pubky: OWNED, secretKey: SECRET_A }])).resolves.toBe(true);
	await expect(removeSharedPubky(OWNED)).resolves.toBe(true);
	await expect(clearOwnedSharedPubkys()).resolves.toBe(true);

	expect(mirror).toHaveBeenCalledWith(OWNED, SECRET_A);
	expect(reconcile).toHaveBeenCalledWith([{ pubky: OWNED, secretKey: SECRET_A }]);
	expect(remove).toHaveBeenCalledWith(OWNED);
	expect(clear).toHaveBeenCalledTimes(1);
});

test('discovery accepts public metadata only and filters owned, malformed, duplicate, and wrong-source rows', async () => {
	list.mockResolvedValue({
		available: true,
		identities: [
			{ version: 1, sourceApp: BITKIT_SOURCE_APP, pubky: OWNED },
			{ version: 1, sourceApp: BITKIT_SOURCE_APP, pubky: SHARED, secretKey: 'must-be-ignored' },
			{ version: 1, sourceApp: BITKIT_SOURCE_APP, pubky: SHARED },
			{ version: 2, sourceApp: BITKIT_SOURCE_APP, pubky: OTHER },
			{ version: 1, sourceApp: 'app.pubkyring', pubky: OTHER },
			{ version: 1, sourceApp: BITKIT_SOURCE_APP, pubky: 'invalid' },
		],
	});

	await expect(discoverSharedPubkys([OWNED])).resolves.toEqual({
		available: true,
		identities: [{ version: 1, sourceApp: BITKIT_SOURCE_APP, pubky: SHARED }],
	});
	expect(derive).not.toHaveBeenCalled();
});

test('retrieves and derives only the selected credential just in time', async () => {
	credential.mockResolvedValue({
		version: 1,
		sourceApp: BITKIT_SOURCE_APP,
		pubky: SHARED,
		secretKey: SECRET_B,
		mnemonic: 'must-be-ignored',
	});
	derive.mockResolvedValue({
		isOk: () => true,
		value: { public_key: `pubky${SHARED}` },
	} as never);

	await expect(getSharedPubkyCredential({ pubky: SHARED, sourceApp: BITKIT_SOURCE_APP })).resolves.toEqual({
		version: 1,
		sourceApp: BITKIT_SOURCE_APP,
		pubky: SHARED,
		secretKey: SECRET_B,
	});
	expect(credential).toHaveBeenCalledWith(SHARED);

	derive.mockResolvedValue({
		isOk: () => true,
		value: { public_key: `pubky${OTHER}` },
	} as never);
	await expect(
		getSharedPubkyCredential({ pubky: SHARED, sourceApp: BITKIT_SOURCE_APP }),
	).resolves.toBeUndefined();
});

test('distinguishes unavailable sharing from an available empty source', async () => {
	list.mockResolvedValue({ available: false, identities: [] });
	await expect(discoverSharedPubkys([])).resolves.toEqual({ available: false, identities: [] });

	list.mockResolvedValue({ available: true, identities: [] });
	await expect(discoverSharedPubkys([])).resolves.toEqual({ available: true, identities: [] });

	list.mockRejectedValue(new Error('missing entitlement'));
	await expect(discoverSharedPubkys([])).resolves.toEqual({ available: false, identities: [] });
});

test('fails closed when native sharing is unavailable or rejects', async () => {
	delete NativeModules.SharedPubky;
	await expect(discoverSharedPubkys([])).resolves.toEqual({ available: false, identities: [] });
	await expect(mirrorSharedPubky(OWNED, SECRET_A)).resolves.toBe(false);
	await expect(removeSharedPubky(OWNED)).resolves.toBe(false);
	await expect(clearOwnedSharedPubkys()).resolves.toBe(false);

	NativeModules.SharedPubky = { mirror, remove, reconcile, clear, list, credential };
	mirror.mockRejectedValue(new Error('store failed'));
	remove.mockRejectedValue(new Error('store failed'));
	reconcile.mockRejectedValue(new Error('store failed'));
	clear.mockRejectedValue(new Error('store failed'));
	await expect(mirrorSharedPubky(OWNED, SECRET_A)).resolves.toBe(false);
	await expect(removeSharedPubky(OWNED)).resolves.toBe(false);
	await expect(reconcileSharedPubkys([{ pubky: OWNED, secretKey: SECRET_A }])).resolves.toBe(false);
	await expect(clearOwnedSharedPubkys()).resolves.toBe(false);
});

test('uses the expanded private access group only on iOS', () => {
	expect(getPrivateKeychainAccessGroup()).toBeUndefined();
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
	expect(getPrivateKeychainAccessGroup()).toBe('TEAM.app.pubkyring');
});

test('serializes identity lifecycle transactions across asynchronous gaps', async () => {
	const events: string[] = [];
	let releaseFirst: () => void = () => {};
	const firstCanFinish = new Promise<void>(resolve => {
		releaseFirst = resolve;
	});

	const first = withPubkyIdentityLifecycle(async () => {
		events.push('first-start');
		await firstCanFinish;
		events.push('first-end');
	});
	await Promise.resolve();
	const second = withPubkyIdentityLifecycle(async () => {
		events.push('second');
	});
	await Promise.resolve();

	expect(events).toEqual(['first-start']);
	releaseFirst();
	await Promise.all([first, second]);
	expect(events).toEqual(['first-start', 'first-end', 'second']);
});
