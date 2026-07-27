import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { appApplicationId } from '../utils/appInfo.ts';

export const REPLACEMENT_APK_PREFIX = 'pubky-ring-app.pubkyring-';
export const REPLACEMENT_RELEASE_ENDPOINT = 'https://api.github.com/repos/pubky/pubky-ring/releases/latest';
export const LEGACY_ANDROID_APPLICATION_ID = 'to.pubky.ring';

const ACTIVATION_STORAGE_KEY = 'legacySunset.replacementRelease';
const TEST_MODE_STORAGE_KEY = 'legacySunset.testMode';
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

export type ParseReplacementReleaseOptions = {
	/** Accept any APK asset instead of only the replacement package APK. Test mode only. */
	allowAnyApk?: boolean;
};

export type DetectReplacementReleaseOptions = {
	storage?: ReplacementReleaseStorage;
	fetcher?: Fetcher;
	timeoutMs?: number;
	/** Match any published APK and never read or write the persisted activation. */
	testMode?: boolean;
};

type DetectionResult = {
	testMode: boolean;
	release: ReplacementRelease | null;
};

const defaultStorage = createMMKV();
const testModeListeners = new Set<() => void>();
let testMode: boolean | undefined;
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

function isApkAsset(asset: GithubAsset): boolean {
	return (
		typeof asset?.name === 'string' &&
		asset.name.endsWith('.apk') &&
		isAllowedApkUrl(asset.browser_download_url)
	);
}

function isReplacementApkAsset(asset: GithubAsset): boolean {
	return isApkAsset(asset) && (asset.name as string).startsWith(REPLACEMENT_APK_PREFIX);
}

export function parseReplacementRelease(
	payload: unknown,
	{ allowAnyApk = false }: ParseReplacementReleaseOptions = {},
): ReplacementRelease | null {
	if (!payload || typeof payload !== 'object') return null;

	const release = payload as GithubRelease;
	if (release.draft !== false || release.prerelease !== false || !isAllowedReleaseUrl(release.html_url)) {
		return null;
	}
	if (!Array.isArray(release.assets)) return null;

	const assets = release.assets as GithubAsset[];
	const apk = assets.find(isReplacementApkAsset) ?? (allowAnyApk ? assets.find(isApkAsset) : undefined);

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

export async function detectReplacementRelease({
	storage: targetStorage = defaultStorage,
	fetcher = fetch,
	timeoutMs = REQUEST_TIMEOUT_MS,
	testMode: useTestMode = false,
}: DetectReplacementReleaseOptions = {}): Promise<ReplacementRelease | null> {
	if (!useTestMode) {
		const persisted = readPersistedActivation(targetStorage);
		if (persisted) return persisted;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetcher(REPLACEMENT_RELEASE_ENDPOINT, {
			signal: controller.signal,
			headers: { Accept: 'application/vnd.github+json' },
		});
		if (!response.ok) return null;

		const release = parseReplacementRelease(await response.json(), { allowAnyApk: useTestMode });
		if (release && !useTestMode) targetStorage.set(ACTIVATION_STORAGE_KEY, JSON.stringify(release));
		return release;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

/** The notice only ever applies to the final legacy Android build. */
export function isLegacySunsetTarget(): boolean {
	return Platform.OS === 'android' && appApplicationId === LEGACY_ANDROID_APPLICATION_ID;
}

export function isTestModeEnabled(): boolean {
	if (testMode === undefined) {
		try {
			testMode = defaultStorage.getString(TEST_MODE_STORAGE_KEY) === 'true';
		} catch {
			testMode = false;
		}
	}
	return testMode;
}

export function setTestModeEnabled(enabled: boolean): void {
	if (isTestModeEnabled() === enabled) return;

	testMode = enabled;
	try {
		defaultStorage.set(TEST_MODE_STORAGE_KEY, enabled ? 'true' : 'false');
	} catch {
		// Best effort. The in-memory value still applies to this session.
	}

	sessionCheck = undefined;
	testModeListeners.forEach(listener => listener());
}

export function subscribeToTestMode(listener: () => void): () => void {
	testModeListeners.add(listener);
	return (): void => {
		testModeListeners.delete(listener);
	};
}

export function getReplacementReleaseForSession(): Promise<ReplacementRelease | null> {
	if (!isLegacySunsetTarget()) return Promise.resolve(null);
	if (!sessionCheck) sessionCheck = detectReplacementRelease({ testMode: isTestModeEnabled() });
	return sessionCheck;
}

export function useReplacementRelease(): {
	replacementRelease: ReplacementRelease | null;
	isReplacementAvailable: boolean;
} {
	const [detection, setDetection] = useState<DetectionResult | null>(null);
	const isTestMode = useSyncExternalStore(subscribeToTestMode, isTestModeEnabled);

	useEffect(() => {
		let mounted = true;
		void getReplacementReleaseForSession().then(release => {
			if (mounted) setDetection({ testMode: isTestMode, release });
		});
		return (): void => {
			mounted = false;
		};
	}, [isTestMode]);

	// Detections from the previous mode are dropped so the banner tracks the toggle immediately.
	const replacementRelease = detection?.testMode === isTestMode ? detection.release : null;

	return {
		replacementRelease,
		isReplacementAvailable: replacementRelease !== null,
	};
}

/**
 * Hidden settings toggle so QA can exercise the sunset notice before the replacement APK is published.
 */
export function useReplacementReleaseTestMode(): {
	isTestModeAvailable: boolean;
	isTestModeEnabled: boolean;
	toggleTestMode: () => void;
} {
	const enabled = useSyncExternalStore(subscribeToTestMode, isTestModeEnabled);

	const toggleTestMode = useCallback(() => {
		setTestModeEnabled(!enabled);
	}, [enabled]);

	return {
		isTestModeAvailable: isLegacySunsetTarget(),
		isTestModeEnabled: enabled,
		toggleTestMode,
	};
}
