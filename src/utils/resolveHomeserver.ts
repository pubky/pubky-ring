import { getHomeserver } from '@synonymdev/react-native-pubky';
import { err, ok, type Result } from '@synonymdev/result';
import { normalizeHomeserver } from './homeservers';

/** An absent public mapping is distinct from a failed lookup. Never publish during discovery. */
export const resolveHomeserver = async (pubky: string): Promise<Result<string | undefined>> => {
	try {
		const result = await getHomeserver(pubky);
		if (result.isErr()) {
			// pubky-core-ffi reports Ok(None) using this exact error message.
			if (result.error.message === 'No homeserver found for this public key') return ok(undefined);
			return err(result.error);
		}
		const homeserver = normalizeHomeserver(result.value);
		return homeserver ? ok(homeserver) : err('Invalid homeserver lookup response');
	} catch (error) {
		return err(error instanceof Error ? error : new Error(String(error)));
	}
};
