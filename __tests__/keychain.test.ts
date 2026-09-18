import { NativeModules, Platform } from 'react-native';
import Keychain from 'react-native-keychain';
import {
	getAllKeychainKeys,
	getKeychainValue,
	getSessionSecret,
	resetKeychainValue,
	resetPubkySessionSecrets,
	setKeychainValue,
	setSessionSecret,
	wipeKeychain,
} from '../src/utils/keychain';

jest.mock('react-native-keychain', () => ({
	getGenericPassword: jest.fn(),
	setGenericPassword: jest.fn(),
	resetGenericPassword: jest.fn(),
	getAllGenericPasswordServices: jest.fn(),
}));
jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key },
}));

const native = {
	privateValue: jest.fn(),
	setPrivateValue: jest.fn(),
	resetPrivateValue: jest.fn(),
	privateServices: jest.fn(),
};
const dependency = jest.mocked(Keychain);

beforeEach(() => {
	jest.resetAllMocks();
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
	NativeModules.SharedPubky = native;
	native.privateValue.mockResolvedValue('stored-value');
	native.privateServices.mockResolvedValue(['identity', 'pubky-session:identity:session']);
	jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

test('routes iOS reads, writes, enumeration and resets exclusively through the scoped bridge', async () => {
	expect((await getKeychainValue({ key: 'identity' })).isOk()).toBe(true);
	expect((await setKeychainValue({ key: 'identity', value: 'updated' })).isOk()).toBe(true);
	await expect(getAllKeychainKeys()).resolves.toEqual(['identity', 'pubky-session:identity:session']);
	expect((await resetKeychainValue({ key: 'identity' })).isOk()).toBe(true);
	expect(native.privateValue).toHaveBeenCalledWith('identity');
	expect(native.setPrivateValue).toHaveBeenCalledWith('identity', 'updated');
	expect(native.resetPrivateValue).toHaveBeenCalledWith('identity');
	for (const method of Object.values(dependency)) expect(method).not.toHaveBeenCalled();
});

test.each([undefined, {}, { privateServices: jest.fn().mockRejectedValue(new Error('locked')) }])(
	'never falls back to dependency enumeration when the iOS bridge is unavailable or fails: %p',
	async module => {
		NativeModules.SharedPubky = module;
		await expect(getAllKeychainKeys()).rejects.toThrow();
		expect(dependency.getAllGenericPasswordServices).not.toHaveBeenCalled();
	},
);

test.each([null, undefined, {}, ['valid', ''], ['valid', 42]])(
	'rejects malformed enumeration without returning a partial list: %p',
	async services => {
		native.privateServices.mockResolvedValue(services);
		await expect(getAllKeychainKeys()).rejects.toThrow();
		expect(dependency.getAllGenericPasswordServices).not.toHaveBeenCalled();
	},
);

test('accepts authoritative empty enumeration and maps missing values or native failures to errors', async () => {
	native.privateServices.mockResolvedValue([]);
	await expect(getAllKeychainKeys()).resolves.toEqual([]);
	native.privateValue.mockResolvedValue(null);
	expect((await getKeychainValue({ key: 'missing' })).isErr()).toBe(true);
	native.privateValue.mockRejectedValue(new Error('locked'));
	native.setPrivateValue.mockRejectedValue(new Error('conflicting records'));
	native.resetPrivateValue.mockRejectedValue(new Error('delete failed'));
	expect((await getKeychainValue({ key: 'identity' })).isErr()).toBe(true);
	expect((await setKeychainValue({ key: 'identity', value: 'updated' })).isErr()).toBe(true);
	expect((await resetKeychainValue({ key: 'identity' })).isErr()).toBe(true);
	for (const method of Object.values(dependency)) expect(method).not.toHaveBeenCalled();
});

test('preserves session service names and deletes only the selected identity sessions', async () => {
	await setSessionSecret({ pubky: 'identity', sessionId: 'session', sessionSecret: 'session-value' });
	await getSessionSecret({ pubky: 'identity', sessionId: 'session' });
	expect(native.setPrivateValue).toHaveBeenCalledWith('pubky-session:identity:session', 'session-value');
	expect(native.privateValue).toHaveBeenCalledWith('pubky-session:identity:session');
	native.privateServices.mockResolvedValue([
		'identity',
		'pubky-session:identity:session',
		'pubky-session:other:session',
	]);
	expect((await resetPubkySessionSecrets({ pubky: 'identity' })).isOk()).toBe(true);
	expect(native.resetPrivateValue).toHaveBeenCalledTimes(1);
	expect(native.resetPrivateValue).toHaveBeenCalledWith('pubky-session:identity:session');
});

test('reports failed wipes and session cleanup without deleting after enumeration failure', async () => {
	native.privateServices.mockRejectedValue(new Error('locked'));
	await expect(wipeKeychain()).resolves.toBe(false);
	expect((await resetPubkySessionSecrets({ pubky: 'identity' })).isErr()).toBe(true);
	expect(native.resetPrivateValue).not.toHaveBeenCalled();
});

test('preserves Android dependency calls, options, and return handling', async () => {
	Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
	dependency.getGenericPassword.mockResolvedValue({ password: 'stored-value' } as never);
	dependency.setGenericPassword.mockResolvedValue({ service: 'identity' } as never);
	dependency.resetGenericPassword.mockResolvedValue(true);
	dependency.getAllGenericPasswordServices.mockResolvedValue(['identity']);
	expect((await getKeychainValue({ key: 'identity' })).isOk()).toBe(true);
	expect((await setKeychainValue({ key: 'identity', value: 'updated' })).isOk()).toBe(true);
	await expect(getAllKeychainKeys()).resolves.toEqual(['identity']);
	expect((await resetKeychainValue({ key: 'identity' })).isOk()).toBe(true);
	expect(dependency.getGenericPassword).toHaveBeenCalledWith({ service: 'identity', cloudSync: false });
	expect(dependency.setGenericPassword).toHaveBeenCalledWith('identity', 'updated', {
		service: 'identity',
		cloudSync: false,
	});
	expect(dependency.resetGenericPassword).toHaveBeenCalledWith({ service: 'identity', cloudSync: false });
	for (const method of Object.values(native)) expect(method).not.toHaveBeenCalled();
	dependency.getGenericPassword.mockResolvedValue(false);
	dependency.setGenericPassword.mockResolvedValue(false);
	dependency.resetGenericPassword.mockResolvedValue(false);
	expect((await getKeychainValue({ key: 'identity' })).isErr()).toBe(true);
	expect((await setKeychainValue({ key: 'identity', value: 'updated' })).isErr()).toBe(true);
	expect((await resetKeychainValue({ key: 'identity' })).isErr()).toBe(true);
});
