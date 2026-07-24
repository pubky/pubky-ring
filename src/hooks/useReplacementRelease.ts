import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { appApplicationId } from '../utils/appInfo.ts';

export const REPLACEMENT_APK_PREFIX = 'pubky-ring-app.pubkyring-';
export const REPLACEMENT_RELEASE_ENDPOINT = 'https://api.github.com/repos/pubky/pubky-ring/releases/latest';
export const LEGACY_ANDROID_APPLICATION_ID = 'to.pubky.ring';

const ACTIVATION_STORAGE_KEY = 'legacySunset.replacementRelease';
const REQUEST_TIMEOUT_MS = 5_000;

export type ReplacementRelease = {
	releaseUrl: string;
	apkUrl: string;
};

type GithubAsset = {
	name?: unknown;
	browser_download_url?: unknown;
};

type GithubRelease = {
	draft?: unknown;
	prerelease?: unknown;
	html_url?: unknown;
	assets?: unknown;
};

export type ReplacementReleaseStorage = {
	getString: (key: string) => string | undefined;
	set: (key: string, value: string) => void;
};

type FetchResponse = {
	ok: boolean;
	json: () => Promise<unknown>;
};

type Fetcher = (
	input: string,
	init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => Promise<FetchResponse>;

const storage = createMMKV();
let sessionCheck: Promise<ReplacementRelease | null> | undefined;

function isAllowedReleaseUrl(value: unknown): value is string {
	if (typeof value !== 'string') return false;

	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' &&
			url.hostname === 'github.com' &&
			url.pathname.startsWith('/pubky/pubky-ring/releases/')
		);
	} catch {
		return false;
	}
}

function isAllowedApkUrl(value: unknown): value is string {
	if (typeof value !== 'string') return false;

	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' &&
			(url.hostname === 'github.com' || url.hostname === 'objects.githubusercontent.com')
		);
	} catch {
		return false;
	}
}

export function parseReplacementRelease(payload: unknown): ReplacementRelease | null {
	if (!payload || typeof payload !== 'object') return null;

	const release = payload as GithubRelease;
	if (release.draft !== false || release.prerelease !== false || !isAllowedReleaseUrl(release.html_url)) {
		return null;
	}
	if (!Array.isArray(release.assets)) return null;

	const apk = (release.assets as GithubAsset[]).find(
		asset =>
			typeof asset?.name === 'string' &&
			asset.name.startsWith(REPLACEMENT_APK_PREFIX) &&
			asset.name.endsWith('.apk') &&
			isAllowedApkUrl(asset.browser_download_url),
	);

	return apk ? { releaseUrl: release.html_url, apkUrl: apk.browser_download_url as string } : null;
}

function readPersistedActivation(targetStorage: ReplacementReleaseStorage): ReplacementRelease | null {
	try {
		const raw = targetStorage.getString(ACTIVATION_STORAGE_KEY);
		return raw ? parsePersistedActivation(JSON.parse(raw)) : null;
	} catch {
		return null;
	}
}

function parsePersistedActivation(value: unknown): ReplacementRelease | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Partial<ReplacementRelease>;
	return isAllowedReleaseUrl(candidate.releaseUrl) && isAllowedApkUrl(candidate.apkUrl)
		? { releaseUrl: candidate.releaseUrl, apkUrl: candidate.apkUrl }
		: null;
}

export async function detectReplacementRelease(
	targetStorage: ReplacementReleaseStorage = storage,
	fetcher: Fetcher = fetch,
	timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<ReplacementRelease | null> {
	const persisted = readPersistedActivation(targetStorage);
	if (persisted) return persisted;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetcher(REPLACEMENT_RELEASE_ENDPOINT, {
			signal: controller.signal,
			headers: { Accept: 'application/vnd.github+json' },
		});
		if (!response.ok) return null;

		const release = parseReplacementRelease(await response.json());
		if (release) targetStorage.set(ACTIVATION_STORAGE_KEY, JSON.stringify(release));
		return release;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

export function getReplacementReleaseForSession(): Promise<ReplacementRelease | null> {
	if (Platform.OS !== 'android' || appApplicationId !== LEGACY_ANDROID_APPLICATION_ID) {
		return Promise.resolve(null);
	}
	if (!sessionCheck) sessionCheck = detectReplacementRelease();
	return sessionCheck;
}

export function useReplacementRelease(): {
	replacementRelease: ReplacementRelease | null;
	isReplacementAvailable: boolean;
} {
	const [replacementRelease, setReplacementRelease] = useState<ReplacementRelease | null>(null);

	useEffect(() => {
		let mounted = true;
		getReplacementReleaseForSession().then(release => {
			if (mounted) setReplacementRelease(release);
		});
		return () => {
			mounted = false;
		};
	}, []);

	return {
		replacementRelease,
		isReplacementAvailable: replacementRelease !== null,
	};
}
