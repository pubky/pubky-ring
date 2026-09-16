import { Linking, NativeModules } from 'react-native';
import { consumeInitialUrls, consumeUrlEvent, hasNativeInitialUrlInbox } from '../src/utils/initialUrl';

const AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=abc123';
const OTHER_AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=def456';

type MutableNativeModules = typeof NativeModules & {
	InitialUrl?: {
		consumePendingDeepLinks: jest.Mock<Promise<string[]>, []>;
	};
};

const mutableNativeModules = NativeModules as MutableNativeModules;
const originalInitialUrlDescriptor = Object.getOwnPropertyDescriptor(NativeModules, 'InitialUrl');

const setNativeInitialUrlModule = (consumePendingDeepLinks: jest.Mock<Promise<string[]>, []>): void => {
	Object.defineProperty(mutableNativeModules, 'InitialUrl', {
		configurable: true,
		value: { consumePendingDeepLinks },
		writable: true,
	});
};

describe('initial URL source', () => {
	afterEach(() => {
		jest.restoreAllMocks();
		if (originalInitialUrlDescriptor) {
			Object.defineProperty(mutableNativeModules, 'InitialUrl', originalInitialUrlDescriptor);
		} else {
			delete mutableNativeModules.InitialUrl;
		}
	});

	it('consumes the Android Activity inbox for an initial URL', async () => {
		const consumePendingDeepLinks = jest.fn<Promise<string[]>, []>().mockResolvedValue([AUTH_URL]);
		setNativeInitialUrlModule(consumePendingDeepLinks);

		expect(hasNativeInitialUrlInbox()).toBe(true);
		await expect(consumeInitialUrls()).resolves.toEqual([AUTH_URL]);
		expect(consumePendingDeepLinks).toHaveBeenCalledTimes(1);
	});

	it('drains the Android Activity inbox when a live event wakes it', async () => {
		const consumePendingDeepLinks = jest
			.fn<Promise<string[]>, []>()
			.mockResolvedValue([AUTH_URL, OTHER_AUTH_URL]);
		setNativeInitialUrlModule(consumePendingDeepLinks);

		await expect(consumeUrlEvent('ignored-by-android')).resolves.toEqual([AUTH_URL, OTHER_AUTH_URL]);
		expect(consumePendingDeepLinks).toHaveBeenCalledTimes(1);
	});

	it('uses Linking for an initial URL when the native inbox is unavailable', async () => {
		const getInitialURL = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(AUTH_URL);

		expect(hasNativeInitialUrlInbox()).toBe(false);
		await expect(consumeInitialUrls()).resolves.toEqual([AUTH_URL]);
		await expect(consumeInitialUrls()).resolves.toEqual([]);
		expect(getInitialURL).toHaveBeenCalledTimes(1);
	});

	it('uses each live event URL when the native inbox is unavailable', async () => {
		await expect(consumeUrlEvent(AUTH_URL)).resolves.toEqual([AUTH_URL]);
		await expect(consumeUrlEvent(OTHER_AUTH_URL)).resolves.toEqual([OTHER_AUTH_URL]);
	});
});
