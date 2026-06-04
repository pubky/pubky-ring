import { generateSecretKey } from '@synonymdev/react-native-pubky';
import { getKeychainValue, setKeychainValue } from '../utils/keychain';

/**
 * Dedicated keychain entry holding the secret used to encrypt the persisted
 * Redux/MMKV store. The encryption key never leaves the secure keystore
 * (iOS Keychain / Android Keystore): it is read at boot and handed to MMKV,
 * which derives the AES key from it internally.
 *
 * A per-pubky secret can't key this store because it is a single global
 * instance: there is no pubky on first launch, there can be many, and the
 * pubky list itself lives inside this store. So we keep one dedicated,
 * high-entropy secret in the keystore instead.
 */
const STORAGE_ENCRYPTION_KEY_SERVICE = 'pubkyring.storageEncryptionKey';

/**
 * Returns the root storage secret held in the keystore. On first launch no
 * entry exists yet, so a new random secret is generated (but not yet persisted
 * — see {@link persistStorageSecret}). The presence of the keychain entry
 * doubles as the "store is already encrypted" migration flag.
 */
export const getStorageSecret = async (): Promise<{
	secret: string;
	isNew: boolean;
}> => {
	const existing = await getKeychainValue({ key: STORAGE_ENCRYPTION_KEY_SERVICE });
	if (existing.isOk() && existing.value) {
		return { secret: existing.value, isNew: false };
	}

	const generated = await generateSecretKey();
	if (generated.isErr()) {
		throw new Error(`Failed to generate storage encryption key: ${generated.error.message}`);
	}
	return { secret: generated.value.secret_key, isNew: true };
};

/**
 * Persists the root secret to the secure keystore. Called only after the store
 * has been successfully encrypted, so an interrupted first launch safely
 * retries (a missing entry means "not yet encrypted").
 */
export const persistStorageSecret = async (secret: string): Promise<void> => {
	const res = await setKeychainValue({ key: STORAGE_ENCRYPTION_KEY_SERVICE, value: secret });
	if (res.isErr()) {
		throw new Error(`Failed to persist storage encryption key: ${res.error.message}`);
	}
};

/**
 * Derives the MMKV encryption key from the keystore secret. MMKV caps the key
 * at 32 bytes for AES-256; the root secret is a uniformly random hex string, so
 * a fixed-length prefix is itself uniformly random key material (128 bits of
 * entropy across 32 hex chars). The derived key is never persisted — only the
 * root secret lives in the keystore.
 */
export const deriveMmkvKey = (secret: string): string => secret.slice(0, 32);
