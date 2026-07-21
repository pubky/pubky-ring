import { NativeModules, Platform } from 'react-native';
import { discoverSharedPubkys, mirrorSharedPubky, removeSharedPubky } from '../src/utils/sharedPubky';
import { getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';

jest.mock('@synonymdev/react-native-pubky', () => ({
	getPublicKeyFromSecretKey: jest.fn(),
}));

const derive = getPublicKeyFromSecretKey as jest.MockedFunction<typeof getPublicKeyFromSecretKey>;
const mirror = jest.fn();
const remove = jest.fn();
const discover = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
	NativeModules.SharedPubky = { mirror, remove, discover };
});

test('mirrors only pubky and secret key and removes by pubky', async () => {
	mirror.mockResolvedValue(undefined);
	remove.mockResolvedValue(undefined);

	await mirrorSharedPubky('pubky-a', 'secret-a');
	await removeSharedPubky('pubky-a');

	expect(mirror).toHaveBeenCalledWith('pubky-a', 'secret-a');
	expect(remove).toHaveBeenCalledWith('pubky-a');
});

test('filters owned, malformed, duplicate, and mismatched discoveries', async () => {
	discover.mockResolvedValue([
		{ pubky: 'owned', secretKey: 'owned-secret' },
		{ pubky: 'valid', secret_key: 'valid-secret', mnemonic: 'must be ignored' },
		{ pubky: 'valid', secretKey: 'duplicate' },
		{ pubky: 'mismatch', secretKey: 'wrong-secret' },
		{ pubky: '', secretKey: 'missing-pubky' },
	]);
	derive.mockImplementation(async secretKey => {
		const public_key = secretKey === 'valid-secret' ? 'valid' : 'different';
		return { isOk: () => true, value: { public_key } } as never;
	});

	await expect(discoverSharedPubkys(['owned'])).resolves.toEqual([
		{ pubky: 'valid', secretKey: 'valid-secret' },
	]);
});

test('fails closed when native sharing is unavailable or rejects', async () => {
	delete NativeModules.SharedPubky;
	await expect(discoverSharedPubkys([])).resolves.toEqual([]);

	NativeModules.SharedPubky = { mirror, remove, discover };
	discover.mockRejectedValue(new Error('unavailable'));
	await expect(discoverSharedPubkys([])).resolves.toEqual([]);

	mirror.mockRejectedValue(new Error('store failed'));
	remove.mockRejectedValue(new Error('store failed'));
	await expect(mirrorSharedPubky('pubky', 'secret')).resolves.toBeUndefined();
	await expect(removeSharedPubky('pubky')).resolves.toBeUndefined();
});

test('does nothing outside Android', async () => {
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
	await mirrorSharedPubky('pubky', 'secret');
	await removeSharedPubky('pubky');
	await expect(discoverSharedPubkys([])).resolves.toEqual([]);
	expect(mirror).not.toHaveBeenCalled();
	expect(remove).not.toHaveBeenCalled();
	expect(discover).not.toHaveBeenCalled();
});
