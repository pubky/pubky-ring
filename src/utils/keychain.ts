import Keychain from 'react-native-keychain';
import { err, ok, Result } from '@synonymdev/result';
import i18n from '../i18n';

const SESSION_SECRET_KEY_PREFIX = 'pubky-session';

const getSessionSecretKey = ({ pubky, sessionId }: { pubky: string; sessionId: string }): string => {
	return `${SESSION_SECRET_KEY_PREFIX}:${pubky}:${sessionId}`;
};

export const getKeychainValue = async ({ key }: { key: string }): Promise<Result<string>> => {
	try {
		const result = await Keychain.getGenericPassword({ service: key });
		if (!result || !result?.password) {
			return err(i18n.t('keychain.failedToGetValue'));
		}
		return ok(result.password);
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
		const res = await Keychain.setGenericPassword(key, value, { service: key });
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
	return await Keychain.getAllGenericPasswordServices();
};

//WARNING: This will wipe the specified key's value from storage
export const resetKeychainValue = async ({ key }: { key: string }): Promise<Result<boolean>> => {
	try {
		const result = await Keychain.resetGenericPassword({ service: key });
		return ok(result);
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

/**
 * Wipes all known device keychain data.
 * @returns {Promise<void>}
 */
export const wipeKeychain = async (): Promise<void> => {
	const allServices = await getAllKeychainKeys();
	await Promise.all(allServices.map(key => resetKeychainValue({ key })));
};
