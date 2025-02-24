import {
	generateSecretKey,
	signUp,
	signIn,
	signOut,
	getPublicKeyFromSecretKey,
	SessionInfo,
} from '@synonymdev/react-native-pubky';
import {
	setKeychainValue,
	resetKeychainValue,
	getKeychainValue,
	getAllKeychainKeys,
} from './keychain';
import { Dispatch } from 'redux';
import {
	addPubky,
	addSession,
	removePubky,
	removeSession,
	setHomeserver,
	setSignedUp,
} from '../store/slices/pubkysSlice';
import { Result, err, ok } from '@synonymdev/result';
import { defaultPubkyState } from '../store/shapes/pubky';
import { showToast } from './helpers.ts';
import { auth } from '@synonymdev/react-native-pubky';
import { getPubkyDataFromStore } from './store-helpers.ts';

export const createNewPubky = async (
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		const genKeyRes = await generateSecretKey();
		if (genKeyRes.isErr()) {
			showToast({
				type: 'error',
				title: 'Error',
				description: 'Failed to generate secret key',
			});
			console.error('Failed to generate secret key');
			return err('Failed to generate secret key');
		}

		const secretKey = genKeyRes.value.secret_key;
		const pubky = genKeyRes.value.public_key;
		const homeserver = defaultPubkyState.homeserver;
		dispatch(setSignedUp({ pubky, signedUp: true }));
		signUpToHomeserver({
			pubky,
			secretKey,
			homeserver,
			dispatch,
		}).then((res) => {
			if (res.isErr()) {
				dispatch(setSignedUp({ pubky, signedUp: false }));
			}
		});
		return await savePubky(secretKey, pubky, dispatch);
	} catch (error) {
		console.error('Error creating pubky:', error);
		showToast({
			type: 'error',
			title: 'Error',
			description: 'Failed to create pubky',
		});
		return err('Failed to create pubky');
	}
};

/**
 * Restores all pubkys from the keychain and signs up to the homeserver.
 * @param {Dispatch} dispatch
 * @returns {Promise<string[]>}
 */
export const restorePubkys = async (dispatch: Dispatch): Promise<string[]> => {
	const allKeys = await getAllKeychainKeys();
	if (allKeys?.length > 0) {
		for (const pubky of allKeys) {
			const secretKey = await getKeychainValue({ key: pubky });
			if (secretKey.isOk()) {
				signUpToHomeserver({
					pubky,
					secretKey: secretKey.value,
					homeserver: defaultPubkyState.homeserver,
					dispatch,
				}).then();
				await savePubky(secretKey.value, pubky, dispatch);
			}
		}
	}
	return allKeys;
};

export const importPubky = async (
	secretKey: string,
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		const pubkyRes = await getPublicKeyFromSecretKey(secretKey);
		if (pubkyRes.isErr()) {
			console.error('Failed to get public key from secret key');
			return err('Failed to get public key from secret key');
		}
		const pubky = pubkyRes.value.public_key;
		const homeserver = defaultPubkyState.homeserver;
		dispatch(setSignedUp({ pubky, signedUp: true }));
		signInToHomeserver({ pubky, homeserver, dispatch, secretKey }).then((res) => {
			if (res.isErr()) {
				dispatch(setSignedUp({ pubky, signedUp: false }));
			}
		});
		return await savePubky(secretKey, pubky, dispatch);
	} catch (error) {
		console.error('Error saving pubky:', error);
		return err('Error saving pubky');
	}
};

export const savePubky = async (
	secretKey: string,
	pubky: string,
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		dispatch(addPubky({ pubky }));
		// Don't await this, we don't want to block the UI for devices with slower Keychains.
		setKeychainValue({
			key: pubky,
			value: secretKey,
		}).then((response) => {
			if (response.isErr()) {
				console.error('Failed to save keychain value');
				showToast({
					type: 'error',
					title: 'Failed to save pubky to keychain',
					description: response.error.message,
				});
				deletePubky(pubky, dispatch).then();
			}
		});
		return ok(pubky);
	} catch (e) {
		console.error('Error saving pubky:', e);
		return err('Error saving pubky');
	}
};

export const deletePubky = async (
	pubky: string,
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		dispatch(removePubky(pubky));
		// Don't await this, we don't want to block the UI for devices with slower Keychains.
		resetKeychainValue({ key: pubky }).then((response) => {
			if (response.isErr()) {
				showToast({
					type: 'error',
					title: 'Failed to delete pubky from keychain',
					description: response.error.message,
				});
				console.error('Failed to delete pubky from keychain');
			}
		});
		return ok(pubky);
	} catch (error) {
		console.error('Error deleting pubky:', error);
		return err('Error deleting pubky');
	}
};

export const getPubkySecretKey = async (pubky: string): Promise<Result<string>> => {
	const res = await getKeychainValue({ key: pubky });
	if (res.isErr()) {
		console.error('Failed to get secret key from keychain');
		return err('Failed to get secret key from keychain');
	}
	if (!res?.value) {
		console.error('Secret key not found in keychain');
		return err('Secret key not found in keychain');
	}
	return ok(res.value);
};

export const signUpToHomeserver = async ({
	pubky,
	secretKey,
	homeserver,
	dispatch,
}: {
	pubky: string;
	secretKey?: string;
	homeserver: string;
	dispatch: Dispatch;
}): Promise<Result<SessionInfo>> => {
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			return err(secretKeyRes.error.message);
		}
		secretKey = secretKeyRes.value;
	}
	const signUpRes = await signUp(secretKey, homeserver);
	if (signUpRes.isErr()) {
		return err(signUpRes.error.message);
	}
	dispatch(setHomeserver({ pubky, homeserver }));
	dispatch(addSession({
		pubky,
		session: {
			...signUpRes.value,
			created_at: Date.now(),
		},
	}));
	dispatch(setSignedUp({ pubky, signedUp: true }));
	return ok(signUpRes.value);
};

export const signInToHomeserver = async ({
	pubky,
	homeserver,
	dispatch,
	secretKey,
}: {
	pubky: string;
	homeserver: string;
	dispatch: Dispatch;
	secretKey?: string;
}): Promise<Result<SessionInfo>> => {
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			return err(secretKeyRes.error.message);
		}
		secretKey = secretKeyRes.value;
	}
	const signInRes = await signIn(secretKey);
	if (signInRes.isErr()) {
		const signUpResponse = await signUpToHomeserver({
			pubky,
			secretKey,
			homeserver,
			dispatch,
		});
		if (signUpResponse.isErr()) {
			// If we also get an error from signUp, return the initial signIn response error.
			return signInRes;
		}
		return signUpResponse;
	}
	dispatch(addSession({
		pubky,
		session: {
			...signInRes.value,
			created_at: Date.now(),
		},
	}));
	dispatch(setSignedUp({ pubky, signedUp: true }));
	return ok(signInRes.value);
};

export const signOutOfHomeserver = async (pubky: string, sessionPubky: string, dispatch: Dispatch): Promise<void> => {
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) {
		return;
	}
	const signOutRes = await signOut(secretKeyRes.value);
	if (signOutRes.isErr()) {
		showToast({
			type: 'error',
			title: 'Failed to sign out of homeserver',
			description: signOutRes.error.message,
		});
		return;
	}
	dispatch(setSignedUp({ pubky, signedUp: false }));
	dispatch(removeSession({ pubky, sessionPubky }));
};

export const truncateStr = (str: string, displayLength: number = 5): string => {
	const minLength = displayLength * 2;

	if (str.length <= minLength) {
		return str;
	}
	return `${str.substring(0, displayLength)}...${str.substring(str.length - displayLength)}`;
};

const TIMEOUT_MS = 20000;
const timeout = (ms: number): Promise<void> =>
	new Promise((_, reject): void => {
		setTimeout(() => reject(new Error('Authentication request timed out')), ms);
	});

export const performAuth = async ({
	pubky,
	authUrl,
	dispatch,
}: {
	pubky: string;
	authUrl: string;
	dispatch: Dispatch;
}): Promise<Result<string>> => {
	try {
		const authPromise = (async (): Promise<Result<string>> => {
			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				return err('Failed to get secret key');
			}
			const pubkyData = getPubkyDataFromStore(pubky);
			const { signedUp, homeserver } = pubkyData;
			if (!signedUp) {
				await signUpToHomeserver({
					pubky,
					secretKey: secretKeyRes.value,
					homeserver,
					dispatch,
				});
			}

			const authRes = await auth(authUrl, secretKeyRes.value);
			if (authRes.isErr()) {
				const signInRes = await signInToHomeserver({
					pubky,
					homeserver,
					dispatch,
					secretKey: secretKeyRes.value,
				});
				if (signInRes.isErr()) {
					return err(signInRes.error.message);
				}
				const authRetryRes = await auth(authUrl, secretKeyRes.value);
				if (authRetryRes.isErr()) {
					console.error('Error processing auth:', authRes.error);
					return err(authRes.error?.message || 'Failed to process auth');
				}
			}
			return ok('success');
		})();

		const timeoutPromise = timeout(TIMEOUT_MS).then(
			(): Result<string> => err('Authentication request timed out')
		);

		return await Promise.race([authPromise, timeoutPromise]);
	} catch (error: unknown) {
		console.error('Auth Error:', error);
		const errorMessage = error instanceof Error
			? error.message
			: 'An error occurred during authorization';
		return err(`Auth Error: ${errorMessage}`);
	}
};
