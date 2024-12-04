import Keychain from 'react-native-keychain';
import {
	err,
	ok,
	Result,
} from '@synonymdev/result';

export const getKeychainValue = async ({
	key,
}: {
    key: string;
}): Promise<Result<string>> => {
	try {
		const result = await Keychain.getGenericPassword({ service: key });
		if (!result || !result?.password) {
			return err('Failed to get keychain value');
		}
		return ok(result.password);
	} catch {
		return err('Failed to get keychain value');
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
		return res ? ok(value) : err('Failed to set keychain value');
	} catch {
		return err('Failed to set keychain value');
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
export const resetKeychainValue = async ({
	key,
}: {
    key: string;
}): Promise<Result<boolean>> => {
	try {
		const result = await Keychain.resetGenericPassword({ service: key });
		return ok(result);
	} catch (e) {
		console.log(e);
		return err('Failed to reset keychain value');
	}
};

/**
 * Wipes all known device keychain data.
 * @returns {Promise<void>}
 */
export const wipeKeychain = async (): Promise<void> => {
	const allServices = await getAllKeychainKeys();
	await Promise.all(allServices.map((key) => resetKeychainValue({ key })));
};
