import Keychain from 'react-native-keychain';
import { NativeModules, Platform } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';
import i18n from '../i18n';
interface PrivateKeychain {
	privateServices(): Promise<unknown>;
	privateValue(service: string): Promise<string | null>;
	setPrivateValue(service: string, value: string): Promise<void>;
	resetPrivateValue(service: string): Promise<void>;
}

// iOS must use the scoped native implementation, including for legacy synchronizable records.
// Never fall back to an unscoped dependency query when the bridge or Keychain is unavailable.
const privateKeychain = (): PrivateKeychain | undefined => {
	if (Platform.OS !== 'ios') return undefined;
	const module = NativeModules.SharedPubky as PrivateKeychain | undefined;
	if (!module) throw new Error('Private Keychain is unavailable');
	return module;
};

const SESSION_SECRET_KEY_PREFIX = 'pubky-session';

const getSessionSecretKey = ({ pubky, sessionId }: { pubky: string; sessionId: string }): string => {
	return `${SESSION_SECRET_KEY_PREFIX}:${pubky}:${sessionId}`;
};

const getSessionSecretKeyPrefix = (pubky: string): string => `${SESSION_SECRET_KEY_PREFIX}:${pubky}:`;

export const getKeychainValue = async ({ key }: { key: string }): Promise<Result<string>> => {
	try {
		const native = privateKeychain();
		const result = native
			? await native.privateValue(key)
			: await Keychain.getGenericPassword({ service: key, cloudSync: false }).then(
					value => value && value.password,
				);
		if (!result) {
			return err(i18n.t('keychain.failedToGetValue'));
		}
		return ok(result);
	} catch {
		return err(i18n.t('keychain.failedToGetValue'));
	}
};

export const setKeychainValue = async ({
	key,
	value,
}: {
	key: string;
	value: string;
}): Promise<Result<string>> => {
	try {
		const native = privateKeychain();
		if (native) {
			await native.setPrivateValue(key, value);
			return ok(value);
		}
		const res = await Keychain.setGenericPassword(key, value, { service: key, cloudSync: false });
		return res ? ok(value) : err(i18n.t('keychain.failedToSetValue'));
	} catch {
		return err(i18n.t('keychain.failedToSetValue'));
	}
};

/**
 * Returns an array of all known Keychain keys.
 * @returns {Promise<string[]>}
 */
export const getAllKeychainKeys = async (): Promise<string[]> => {
	const native = privateKeychain();
	if (native) {
		const services = await native.privateServices();
		if (
			!Array.isArray(services) ||
			services.some(service => typeof service !== 'string' || !service.length)
		) {
			throw new Error('Invalid private Keychain services');
		}
		return services;
	}
	return await Keychain.getAllGenericPasswordServices();
};

//WARNING: This will wipe the specified key's value from storage
export const resetKeychainValue = async ({ key }: { key: string }): Promise<Result<boolean>> => {
	try {
		const native = privateKeychain();
		if (native) {
			await native.resetPrivateValue(key);
			return ok(true);
		}
		const result = await Keychain.resetGenericPassword({ service: key, cloudSync: false });
		return result ? ok(true) : err(i18n.t('keychain.failedToResetValue'));
	} catch (e) {
		console.log(e);
		return err(i18n.t('keychain.failedToResetValue'));
	}
};

export const setSessionSecret = async ({
	pubky,
	sessionId,
	sessionSecret,
}: {
	pubky: string;
	sessionId: string;
	sessionSecret: string;
}): Promise<Result<string>> => {
	return setKeychainValue({
		key: getSessionSecretKey({ pubky, sessionId }),
		value: sessionSecret,
	});
};

export const getSessionSecret = async ({
	pubky,
	sessionId,
}: {
	pubky: string;
	sessionId: string;
}): Promise<Result<string>> => {
	return getKeychainValue({
		key: getSessionSecretKey({ pubky, sessionId }),
	});
};

export const resetSessionSecret = async ({
	pubky,
	sessionId,
}: {
	pubky: string;
	sessionId: string;
}): Promise<Result<boolean>> => {
	return resetKeychainValue({
		key: getSessionSecretKey({ pubky, sessionId }),
	});
};

export const resetPubkySessionSecrets = async ({ pubky }: { pubky: string }): Promise<Result<boolean>> => {
	try {
		const sessionSecretKeyPrefix = getSessionSecretKeyPrefix(pubky);
		const allServices = await getAllKeychainKeys();
		const sessionSecretKeys = allServices.filter(key => key.startsWith(sessionSecretKeyPrefix));
		const results = await Promise.all(sessionSecretKeys.map(key => resetKeychainValue({ key })));
		const error = results.find(result => result.isErr());

		return error?.isErr() ? err(error.error) : ok(true);
	} catch {
		return err(i18n.t('keychain.failedToResetValue'));
	}
};

/**
 * Wipes all known device keychain data.
 * @returns {Promise<boolean>}
 */
export const wipeKeychain = async (): Promise<boolean> => {
	try {
		const allServices = await getAllKeychainKeys();
		const results = await Promise.all(allServices.map(key => resetKeychainValue({ key })));
		return results.every(result => result.isOk());
	} catch {
		return false;
	}
};
