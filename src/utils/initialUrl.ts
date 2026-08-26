/**
 * Initial URL consumption guard.
 *
 * On Android, MainActivity is declared `singleTask`, so its task record - and the VIEW intent that
 * created it - survives the process being killed. Resuming such a task can hand a recreated
 * activity a deeplink from an earlier run, which `Linking.getInitialURL()` then reports as if it
 * had just been delivered. A `pubkyauth://` URL is a one-shot credential naming a relay channel,
 * so replaying one re-presents an authorization request whose requester is long gone.
 *
 * MainActivity now drops launch intents it can identify as replays, but that relies on flags the
 * system does not set in every path, so the initial URL is also treated as consumed here: the last
 * one handled is remembered across process death and an exact repeat is ignored.
 *
 * This applies only to the initial URL. A URL arriving on the `url` event is always a fresh
 * delivery and is never deduplicated, so re-sending the same link to a running app still works.
 */

import { createMMKV } from 'react-native-mmkv';

const STORAGE_KEY = 'deepLink.consumedInitialUrl';

export type InitialUrlStorage = {
	getString: (key: string) => string | undefined;
	set: (key: string, value: string) => void;
};

let defaultStorage: InitialUrlStorage | undefined;

function getDefaultStorage(): InitialUrlStorage {
	if (!defaultStorage) defaultStorage = createMMKV();
	return defaultStorage;
}

/**
 * Non-cryptographic 32-bit FNV-1a digest. The URL itself carries a client secret, so only a
 * fingerprint of it is persisted.
 */
export function fingerprintUrl(url: string): string {
	let hash = 0x811c9dc5;
	for (let i = 0; i < url.length; i++) {
		// eslint-disable-next-line no-bitwise
		hash ^= url.charCodeAt(i);
		// eslint-disable-next-line no-bitwise
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return `${url.length.toString(16)}-${hash.toString(16)}`;
}

/**
 * Claims an initial URL for handling. Returns false when this exact URL was already handled as an
 * initial URL, which means the platform replayed a stale launch intent rather than delivering
 * something new.
 */
export function claimInitialUrl(url: string, storage: InitialUrlStorage = getDefaultStorage()): boolean {
	const fingerprint = fingerprintUrl(url);

	try {
		if (storage.getString(STORAGE_KEY) === fingerprint) return false;
		storage.set(STORAGE_KEY, fingerprint);
	} catch {
		// Storage is best effort. If it is unavailable, handling the URL beats dropping it.
		return true;
	}

	return true;
}
