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
} from './keychain';
import { Dispatch } from 'redux';
import {
	addPubky,
	addSession,
	removePubky,
	removeSession,
	setHomeserver,
} from '../store/slices/pubkysSlice';
import { Alert } from 'react-native';
import {
	Result, err, ok,
} from '@synonymdev/result';

export const createNewPubky = async (
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		const genKeyRes = await generateSecretKey();
		if (genKeyRes.isErr()) {
			Alert.alert('Failed to generate secret key');
			console.error('Failed to generate secret key');
			return err('Failed to generate secret key');
		}

		const secretKey = genKeyRes.value.secret_key;
		const pubky = genKeyRes.value.public_key;
		return await savePubky(secretKey, pubky, dispatch);
	} catch (error) {
		console.error('Error creating pubky:', error);
		Alert.alert('Failed to create pubky');
		return err('Failed to create pubky');
	}
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
		const response = await setKeychainValue({
			key: pubky,
			value: secretKey,
		});
		if (response.isErr()) {
			console.error('Failed to save keychain value');
			return err('Failed to save keychain value');
		}
		dispatch(addPubky({ pubky }));
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
		const response = await resetKeychainValue({ key: pubky });
		if (response.isErr()) {
			console.error('Failed to delete pubky from keychain');
			return err('Failed to delete pubky from keychain');
		}

		dispatch(removePubky(pubky));
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

export const signInToHomeserver = async (pubky: string, homeserver: string, dispatch: Dispatch): Promise<Result<SessionInfo>> => {
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) {
		return err(secretKeyRes.error.message);
	}

	const signUpRes = await signUp(secretKeyRes.value, homeserver);
	if (signUpRes.isOk()) {
		dispatch(setHomeserver({ pubky,
			homeserver }));
		const signInRes = await signIn(secretKeyRes.value);
		if (signInRes.isOk()) {
			dispatch(addSession({
				pubky,
				session: { ...signInRes.value,
					created_at: Date.now() },
			}));
			return ok(signInRes.value);
		}
		dispatch(addSession({
			pubky,
			session: { ...signUpRes.value,
				created_at: Date.now() },
		}));
		return ok(signUpRes.value);
	}
	return err(signUpRes.error.message);
};

export const signOutOfHomeserver = async (pubky: string, sessionPubky: string, dispatch: Dispatch): Promise<void> => {
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) {
		return;
	}
	const signOutRes = await signOut(secretKeyRes.value);
	if (signOutRes.isErr()) {
		Alert.alert('Failed to sign out of homeserver', signOutRes.error.message);
		return;
	}
	dispatch(removeSession({ pubky, sessionPubky }));
};
