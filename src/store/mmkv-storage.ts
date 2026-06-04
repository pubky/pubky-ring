import { Storage } from 'redux-persist';
import { createMMKV, MMKV } from 'react-native-mmkv';
import { deriveMmkvKey, getStorageSecret, persistStorageSecret } from './storageEncryption';

// Matches the default instance id used by `createMMKV()` so the encrypted
// instance points at the same on-disk file as any pre-existing plaintext data.
const MMKV_ID = 'mmkv.default';
const ENCRYPTION_TYPE = 'AES-256' as const;

let storage: MMKV | null = null;

/**
 * Initialises the encrypted MMKV instance backing redux-persist. Must be
 * awaited before the persistor reads any state (see store/index.ts).
 *
 * - First launch (fresh install or first run after this ships): the store is
 *   opened unencrypted and `encrypt()` encrypts the existing data in place, so
 *   upgrading users keep their pubky list. The key is persisted to the keystore
 *   only after encryption succeeds, so an interrupted upgrade retries next launch.
 * - Subsequent launches: the keystore already holds the key, so the store is
 *   opened with it directly.
 */
export const initReduxStorage = async (): Promise<void> => {
	if (storage) {
		return;
	}
	const { secret, isNew } = await getStorageSecret();
	const key = deriveMmkvKey(secret);
	if (isNew) {
		// Open the (possibly legacy, unencrypted) store and encrypt it in place.
		const instance = createMMKV({ id: MMKV_ID });
		instance.encrypt(key, ENCRYPTION_TYPE);
		await persistStorageSecret(secret);
		storage = instance;
	} else {
		storage = createMMKV({ id: MMKV_ID, encryptionKey: key, encryptionType: ENCRYPTION_TYPE });
	}
};

const getStorage = (): MMKV => {
	if (!storage) {
		throw new Error('reduxStorage used before initReduxStorage() completed');
	}
	return storage;
};

export const reduxStorage: Storage = {
	setItem: (key, value) => {
		getStorage().set(key, value);
		return Promise.resolve(true);
	},
	getItem: key => {
		const value = getStorage().getString(key);
		return Promise.resolve(value);
	},
	removeItem: key => {
		getStorage().remove(key);
		return Promise.resolve();
	},
};
