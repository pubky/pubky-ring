jest.mock('react-native-mmkv', () => ({
	__esModule: true,
	createMMKV: () => ({ getString: jest.fn(), set: jest.fn() }),
}));

import { claimInitialUrl, fingerprintUrl, InitialUrlStorage } from '../src/utils/initialUrl';

const AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=abc123';
const OTHER_AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=def456';

function createStorage(): InitialUrlStorage & { values: Record<string, string> } {
	const values: Record<string, string> = {};
	return {
		values,
		getString: (key: string) => values[key],
		set: (key: string, value: string) => {
			values[key] = value;
		},
	};
}

describe('claimInitialUrl', () => {
	it('claims a URL the first time it is seen', () => {
		expect(claimInitialUrl(AUTH_URL, createStorage())).toBe(true);
	});

	it('rejects the same URL on a later launch', () => {
		const storage = createStorage();

		expect(claimInitialUrl(AUTH_URL, storage)).toBe(true);
		expect(claimInitialUrl(AUTH_URL, storage)).toBe(false);
	});

	it('claims a different URL after one was consumed', () => {
		const storage = createStorage();
		claimInitialUrl(AUTH_URL, storage);

		expect(claimInitialUrl(OTHER_AUTH_URL, storage)).toBe(true);
		// The newest URL is now the one that is remembered.
		expect(claimInitialUrl(OTHER_AUTH_URL, storage)).toBe(false);
		expect(claimInitialUrl(AUTH_URL, storage)).toBe(true);
	});

	it('does not persist the URL itself', () => {
		const storage = createStorage();
		claimInitialUrl(AUTH_URL, storage);

		const persisted = Object.values(storage.values).join('|');
		expect(persisted).not.toContain('abc123');
		expect(persisted).not.toContain('pubkyauth');
	});

	it('claims the URL when storage is unavailable', () => {
		const storage: InitialUrlStorage = {
			getString: () => {
				throw new Error('storage unavailable');
			},
			set: () => {},
		};

		expect(claimInitialUrl(AUTH_URL, storage)).toBe(true);
	});
});

describe('fingerprintUrl', () => {
	it('is stable for the same URL and differs for others', () => {
		expect(fingerprintUrl(AUTH_URL)).toBe(fingerprintUrl(AUTH_URL));
		expect(fingerprintUrl(AUTH_URL)).not.toBe(fingerprintUrl(OTHER_AUTH_URL));
	});
});
