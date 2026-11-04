import { NativeModules } from 'react-native';
import {
	authenticateDevice,
	requireDeviceAuthentication,
	openDeviceAuthSettings,
	DeviceAuthError,
} from '../src/utils/deviceAuth';

let mockRequired = true;
jest.mock('../src/utils/store-helpers', () => ({
	getStore: () => ({ settings: { requireDeviceAuth: mockRequired } }),
}));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(res => {
		resolve = res;
	});
	return { promise, resolve };
};

beforeEach(() => {
	jest.useFakeTimers();
	mockRequired = true;
	NativeModules.DeviceAuthentication = { authenticate: jest.fn(async () => true), cancel: jest.fn() };
});
afterEach(() => {
	jest.clearAllTimers();
	jest.useRealTimers();
});

it('leaves upgraded/default-off installations usable without a native prompt', async () => {
	mockRequired = false;
	await requireDeviceAuthentication('authorize');
	expect(NativeModules.DeviceAuthentication.authenticate).not.toHaveBeenCalled();
});

it('requires a fresh challenge for each operation, including immediately consecutive ones', async () => {
	await requireDeviceAuthentication('first identity');
	await requireDeviceAuthentication('second identity');
	const calls = NativeModules.DeviceAuthentication.authenticate.mock.calls;
	expect(calls).toHaveLength(2);
	expect(calls[0][0]).not.toBe(calls[1][0]);
	expect(calls.map((call: string[]) => call[1])).toEqual(['first identity', 'second identity']);
});

it('does not launch a prompt for a request already cancelled', async () => {
	const request = new AbortController();
	request.abort();
	await expect(requireDeviceAuthentication('authorize', request.signal)).rejects.toMatchObject({
		code: 'cancelled',
	});
	expect(NativeModules.DeviceAuthentication.authenticate).not.toHaveBeenCalled();
});

it('serializes prompts and never shares the successful result with another request', async () => {
	const result = deferred<boolean>();
	NativeModules.DeviceAuthentication.authenticate.mockReturnValueOnce(result.promise);
	const first = authenticateDevice('first');
	await expect(authenticateDevice('second')).rejects.toMatchObject({ code: 'busy' });
	result.resolve(true);
	await first;
	await authenticateDevice('second retry');
	expect(NativeModules.DeviceAuthentication.authenticate).toHaveBeenCalledTimes(2);
});

it('cancels the matching native request and ignores its late success', async () => {
	const result = deferred<boolean>();
	const request = new AbortController();
	NativeModules.DeviceAuthentication.authenticate.mockReturnValueOnce(result.promise);
	const response = authenticateDevice('authorize', request.signal).catch(error => error);
	request.abort();
	expect(await response).toMatchObject({ code: 'cancelled' });
	expect(NativeModules.DeviceAuthentication.cancel).toHaveBeenCalledWith(
		NativeModules.DeviceAuthentication.authenticate.mock.calls[0][0],
	);
	result.resolve(true);
	await authenticateDevice('new request');
});

it('expires a prompt even if native authentication never settles', async () => {
	NativeModules.DeviceAuthentication.authenticate.mockReturnValueOnce(new Promise(() => {}));
	const response = authenticateDevice('authorize').catch(error => error);
	jest.advanceTimersByTime(60000);
	expect(await response).toMatchObject({ code: 'cancelled' });
	expect(NativeModules.DeviceAuthentication.cancel).toHaveBeenCalledTimes(1);
});

it.each(['cancelled', 'unavailable', 'failed'])(
	'fails closed on native %s without clearing the preference',
	async code => {
		NativeModules.DeviceAuthentication.authenticate.mockRejectedValueOnce({ code });
		await expect(requireDeviceAuthentication('authorize')).rejects.toMatchObject({ code });
		expect(mockRequired).toBe(true);
	},
);

it('fails closed when the native bridge is missing', async () => {
	delete NativeModules.DeviceAuthentication;
	await expect(requireDeviceAuthentication('authorize')).rejects.toBeInstanceOf(DeviceAuthError);
});

it('localizes errors when native device settings cannot be opened', async () => {
	NativeModules.DeviceAuthentication.openEnrollment = jest.fn(async () => {
		throw new Error('Cannot open Settings');
	});
	await expect(openDeviceAuthSettings()).rejects.toMatchObject({
		code: 'unavailable',
		message: 'deviceAuth.unavailable',
	});
});
