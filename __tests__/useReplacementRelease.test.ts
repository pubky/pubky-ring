import {
	detectReplacementRelease,
	parseReplacementRelease,
	REPLACEMENT_APK_PREFIX,
	REPLACEMENT_RELEASE_ENDPOINT,
	type ReplacementReleaseStorage,
} from '../src/hooks/useReplacementRelease';

jest.mock('react-native-mmkv', () => ({
	createMMKV: () => ({ getString: jest.fn(), set: jest.fn() }),
}));

const validRelease = {
	draft: false,
	prerelease: false,
	html_url: 'https://github.com/pubky/pubky-ring/releases/tag/v2.0.0',
	assets: [
		{
			name: `${REPLACEMENT_APK_PREFIX}v2.0-1.apk`,
			browser_download_url:
				'https://github.com/pubky/pubky-ring/releases/download/v2.0.0/pubky-ring-app.pubkyring-v2.0-1.apk',
		},
	],
};

const legacyRelease = {
	draft: false,
	prerelease: false,
	html_url: 'https://github.com/pubky/pubky-ring/releases/tag/v1.16',
	assets: [
		{
			name: 'SHA256SUMS',
			browser_download_url: 'https://github.com/pubky/pubky-ring/releases/download/v1.16/SHA256SUMS',
		},
		{
			name: 'app-universal-release-1.16-23.apk',
			browser_download_url:
				'https://github.com/pubky/pubky-ring/releases/download/v1.16/app-universal-release-1.16-23.apk',
		},
	],
};

function memoryStorage(initial?: string): ReplacementReleaseStorage & { value?: string } {
	return {
		value: initial,
		getString() {
			return this.value;
		},
		set(_key, value) {
			this.value = value;
		},
	};
}

describe('parseReplacementRelease', () => {
	test('accepts a public release with the replacement APK', () => {
		expect(parseReplacementRelease(validRelease)).toEqual({
			releaseUrl: validRelease.html_url,
			apkUrl: validRelease.assets[0].browser_download_url,
		});
	});

	test.each([
		{ ...validRelease, draft: true },
		{ ...validRelease, prerelease: true },
		{ ...validRelease, html_url: 'https://example.com/releases/tag/v2' },
		{ ...validRelease, assets: [{ ...validRelease.assets[0], name: 'pubky-ring-v2.apk' }] },
		{
			...validRelease,
			assets: [{ ...validRelease.assets[0], browser_download_url: 'http://github.com/file.apk' }],
		},
		{
			...validRelease,
			assets: [{ ...validRelease.assets[0], browser_download_url: 'https://evil.example/file.apk' }],
		},
	])('rejects an ineligible release', release => {
		expect(parseReplacementRelease(release)).toBeNull();
	});

	test('rejects a release that only ships the legacy APK', () => {
		expect(parseReplacementRelease(legacyRelease)).toBeNull();
	});

	test('accepts any published APK in test mode', () => {
		expect(parseReplacementRelease(legacyRelease, { allowAnyApk: true })).toEqual({
			releaseUrl: legacyRelease.html_url,
			apkUrl: legacyRelease.assets[1].browser_download_url,
		});
	});

	test('prefers the replacement APK in test mode', () => {
		const release = { ...validRelease, assets: [...legacyRelease.assets, ...validRelease.assets] };
		expect(parseReplacementRelease(release, { allowAnyApk: true })?.apkUrl).toBe(
			validRelease.assets[0].browser_download_url,
		);
	});

	test('still rejects an untrusted APK host in test mode', () => {
		const release = {
			...legacyRelease,
			assets: [{ ...legacyRelease.assets[1], browser_download_url: 'https://evil.example/file.apk' }],
		};
		expect(parseReplacementRelease(release, { allowAnyApk: true })).toBeNull();
	});

	test('accepts GitHub object storage for the APK', () => {
		const release = {
			...validRelease,
			assets: [
				{
					...validRelease.assets[0],
					browser_download_url: 'https://objects.githubusercontent.com/github-production-release-asset/file.apk',
				},
			],
		};
		expect(parseReplacementRelease(release)?.apkUrl).toBe(release.assets[0].browser_download_url);
	});
});

describe('detectReplacementRelease', () => {
	test('fetches, activates, and persists a matching release', async () => {
		const storage = memoryStorage();
		const fetcher = jest.fn(async () => ({ ok: true, json: async () => validRelease }));

		const result = await detectReplacementRelease({ storage, fetcher });

		expect(fetcher).toHaveBeenCalledWith(
			REPLACEMENT_RELEASE_ENDPOINT,
			expect.objectContaining({ signal: expect.anything() }),
		);
		expect(result?.apkUrl).toBe(validRelease.assets[0].browser_download_url);
		expect(JSON.parse(storage.value ?? '{}')).toEqual(result);
	});

	test('uses a valid persisted activation without fetching', async () => {
		const stored = {
			releaseUrl: validRelease.html_url,
			apkUrl: validRelease.assets[0].browser_download_url,
		};
		const fetcher = jest.fn();

		await expect(
			detectReplacementRelease({ storage: memoryStorage(JSON.stringify(stored)), fetcher }),
		).resolves.toEqual(stored);
		expect(fetcher).not.toHaveBeenCalled();
	});

	test.each([
		jest.fn(async () => ({ ok: false, json: async () => validRelease })),
		jest.fn(async () => ({ ok: true, json: async () => ({ ...validRelease, draft: true }) })),
		jest.fn(async () => {
			throw new Error('offline');
		}),
	])('fails closed without persisting', async fetcher => {
		const storage = memoryStorage();
		await expect(detectReplacementRelease({ storage, fetcher })).resolves.toBeNull();
		expect(storage.value).toBeUndefined();
	});

	test('aborts a request after the timeout', async () => {
		jest.useFakeTimers();
		const fetcher = jest.fn(
			(_url: string, init?: { signal?: AbortSignal }) =>
				new Promise<never>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
				}),
		);
		const result = detectReplacementRelease({ storage: memoryStorage(), fetcher, timeoutMs: 100 });

		jest.advanceTimersByTime(100);
		await expect(result).resolves.toBeNull();
		jest.useRealTimers();
	});

	test('test mode activates on the latest published APK without persisting', async () => {
		const storage = memoryStorage();
		const fetcher = jest.fn(async () => ({ ok: true, json: async () => legacyRelease }));

		const result = await detectReplacementRelease({ storage, fetcher, testMode: true });

		expect(result?.apkUrl).toBe(legacyRelease.assets[1].browser_download_url);
		expect(storage.value).toBeUndefined();
	});

	test('test mode refetches instead of reusing a persisted activation', async () => {
		const stored = {
			releaseUrl: validRelease.html_url,
			apkUrl: validRelease.assets[0].browser_download_url,
		};
		const fetcher = jest.fn(async () => ({ ok: true, json: async () => legacyRelease }));

		const result = await detectReplacementRelease({
			storage: memoryStorage(JSON.stringify(stored)),
			fetcher,
			testMode: true,
		});

		expect(fetcher).toHaveBeenCalledTimes(1);
		expect(result?.apkUrl).toBe(legacyRelease.assets[1].browser_download_url);
	});
});
