import { NativeModules } from 'react-native';
import { getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';
import { err, ok, Result } from '@synonymdev/result';

export type TExternalPubky = {
	pubky: string;
	sourceApp: string;
};

const SECRET_KEY_PATTERN = /^[0-9a-f]{64}$/;

const SharedPubky = NativeModules.SharedPubky;

/**
 * Lists the pubkys other apps published to the shared store.
 * An ok result is authoritative (an empty array means there definitively are none),
 * an err means the shared store could not be read.
 */
export const listExternalPubkys = async (): Promise<Result<TExternalPubky[]>> => {
	if (!SharedPubky) {
		return err('SharedPubky native module unavailable');
	}
	try {
		return ok(await SharedPubky.listExternal());
	} catch (e) {
		return err(JSON.stringify(e));
	}
};

/**
 * Reads the secret key of a pubky owned by another app, just in time for signing.
 * The secret is only returned if it is 64 lowercase hex characters and derives the requested pubky.
 */
export const getExternalSecretKey = async (pubky: string, sourceApp: string): Promise<Result<string>> => {
	try {
		const secretKey = await SharedPubky.getExternalSecret(pubky, sourceApp);
		if (!SECRET_KEY_PATTERN.test(secretKey)) {
			return err('Shared record is missing or malformed');
		}
		const pubkyRes = await getPublicKeyFromSecretKey(secretKey);
		if (pubkyRes.isErr() || pubkyRes.value.public_key !== pubky) {
			return err('Shared record does not belong to this pubky');
		}
		return ok(secretKey);
	} catch (e) {
		return err(JSON.stringify(e));
	}
};

/** Owned records are best effort: the private keychain stays the source of truth, so failures never throw. */
const updateOwned = async (update: () => Promise<void>): Promise<void> => {
	try {
		await update();
	} catch (e) {
		console.log('Failed to update the shared pubky records', e);
	}
};

export const publishOwnedPubky = (pubky: string, secretKey: string): Promise<void> =>
	updateOwned(() => SharedPubky?.setOwned(pubky, secretKey));

export const unpublishOwnedPubky = (pubky: string): Promise<void> =>
	updateOwned(() => SharedPubky?.removeOwned(pubky));

/** Unlike single records, a wipe reports failures: nothing retries it, so a leftover record would stay readable by other apps. */
export const unpublishAllOwnedPubkys = async (): Promise<Result<void>> => {
	try {
		await SharedPubky?.removeAllOwned();
		return ok(undefined);
	} catch (e) {
		return err(JSON.stringify(e));
	}
};

export const filterUnadoptedExternal = (external: TExternalPubky[], pubkys: string[]): TExternalPubky[] =>
	external.filter(({ pubky }) => !pubkys.includes(pubky));
