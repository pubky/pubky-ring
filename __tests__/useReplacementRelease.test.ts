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

		const result = await detectReplacementRelease(storage, fetcher);

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

		await expect(detectReplacementRelease(memoryStorage(JSON.stringify(stored)), fetcher)).resolves.toEqual(
			stored,
		);
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
		await expect(detectReplacementRelease(storage, fetcher)).resolves.toBeNull();
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
		const result = detectReplacementRelease(memoryStorage(), fetcher, 100);

		jest.advanceTimersByTime(100);
		await expect(result).resolves.toBeNull();
		jest.useRealTimers();
	});
});
