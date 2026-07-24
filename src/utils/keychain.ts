import Keychain from 'react-native-keychain';
import { err, ok, Result } from '@synonymdev/result';
import i18n from '../i18n';
import { getPrivateKeychainAccessGroup, getPrivateKeychainServices } from './sharedPubky.ts';

const keychainOptions = (service?: string): { service?: string; accessGroup?: string; cloudSync: false } => {
	const accessGroup = getPrivateKeychainAccessGroup();
	return {
		...(service ? { service } : {}),
		...(accessGroup ? { accessGroup } : {}),
		cloudSync: false,
	};
};

export const getKeychainValue = async ({ key }: { key: string }): Promise<Result<string>> => {
	try {
		const result = await Keychain.getGenericPassword(keychainOptions(key));
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
		const res = await Keychain.setGenericPassword(key, value, keychainOptions(key));
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
	const privateServices = await getPrivateKeychainServices();
	if (privateServices) return privateServices;
	return await Keychain.getAllGenericPasswordServices();
};

//WARNING: This will wipe the specified key's value from storage
export const resetKeychainValue = async ({ key }: { key: string }): Promise<Result<boolean>> => {
	try {
		const result = await Keychain.resetGenericPassword(keychainOptions(key));
		return result ? ok(true) : err(i18n.t('keychain.failedToResetValue'));
	} catch (e) {
		console.log(e);
		return err(i18n.t('keychain.failedToResetValue'));
	}
};

/**
 * Wipes all known device keychain data.
 * @returns {Promise<void>}
 */
export const wipeKeychain = async (): Promise<boolean> => {
	const allServices = await getAllKeychainKeys();
	const results = await Promise.all(allServices.map(key => resetKeychainValue({ key })));
	return results.every(result => result.isOk());
};
