import {
	signUp,
	signIn,
	signOut,
	getPublicKeyFromSecretKey,
	SessionInfo,
	getSignupToken as _getSignupToken,
	republishHomeserver as _republishHomeserver,
	getHomeserver,
	get,
	generateMnemonicPhraseAndKeypair,
	mnemonicPhraseToKeypair,
} from '@synonymdev/react-native-pubky';
import {
	setKeychainValue,
	resetKeychainValue,
	getKeychainValue,
	getAllKeychainKeys,
} from './keychain';
import { Dispatch } from 'redux';
import {
	addProcessing,
	addPubky,
	addSession,
	removeProcessing,
	removePubky,
	removeSession,
	setHomeserver,
	setPubkyData,
	setSignedUp,
} from '../store/slices/pubkysSlice';
import { Result, err, ok } from '@synonymdev/result';
import { defaultProfile, defaultPubkyState } from '../store/shapes/pubky';
import { showToast } from './helpers.ts';
import { getErrorMessage } from './errorHandler.ts';
import { auth } from '@synonymdev/react-native-pubky';
import { getPubkyDataFromStore } from './store-helpers.ts';
import { EBackupPreference, IKeychainData, TProfile } from '../types/pubky.ts';
import { DEFAULT_HOMESERVER, STAGING_HOMESERVER } from "./constants.ts";
import i18n from '../i18n';

export const getSignupToken = ({
	homeserver,
	adminPassword,
}: {
	homeserver: string;
	adminPassword: string;
}): Promise<Result<string>> => {
	return _getSignupToken(homeserver, adminPassword);
};

export const republishHomeserver = async ({
	pubky,
	secretKey,
	homeserver,
	dispatch,
}: {
	pubky: string;
	secretKey?: string;
	homeserver: string;
	dispatch: Dispatch;
}): Promise<Result<string>> => {
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			return err(secretKeyRes.error.message);
		}
		secretKey = secretKeyRes.value.secretKey;
	}
	const res = await _republishHomeserver(secretKey, homeserver);
	if (res.isErr()) {
		return err(res.error.message);
	}
	dispatch(setHomeserver({ pubky, homeserver }));
	return ok(res.value);
};

export const createNewPubky = async (
	dispatch: Dispatch
): Promise<Result<string>> => {
	try {
		const genKeyRes = await generateMnemonicPhraseAndKeypair();
		if (genKeyRes.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('common.error'),
				description: i18n.t('pubkyErrors.failedToGenerateSecretKey'),
			});
			console.error('Failed to generate secret key');
			return err(i18n.t('pubkyErrors.failedToGenerateSecretKey'));
		}

		const mnemonic = genKeyRes.value.mnemonic;
		const secretKey = genKeyRes.value.secret_key;
		const pubky = genKeyRes.value.public_key;
		return await savePubky({
			mnemonic,
			secretKey,
			pubky,
			dispatch,
			backupPreference: EBackupPreference.unknown
		});
	} catch (error) {
		console.error('Error creating pubky:', error);
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('pubkyErrors.failedToCreatePubky'),
		});
		return err(i18n.t('pubkyErrors.failedToCreatePubky'));
	}
};

/**
 * Creates a new pubky and signs up with the provided invite code automatically
 */
export const createPubkyWithInviteCode = async (
	inviteCode: string,
	dispatch: Dispatch,
	homeserver: string = DEFAULT_HOMESERVER
): Promise<Result<{ pubky: string }>> => {
	try {
		// Generate new pubky
		const genKeyRes = await generateMnemonicPhraseAndKeypair();
		if (genKeyRes.isErr()) {
			return err(i18n.t('pubkyErrors.failedToGenerateSecretKey'));
		}

		const mnemonic = genKeyRes.value.mnemonic;
		const secretKey = genKeyRes.value.secret_key;
		const pubky = genKeyRes.value.public_key;

		dispatch(addProcessing({ pubky }));
		try {
			const saveRes = await savePubky({
				mnemonic,
				secretKey,
				pubky,
				dispatch,
				backupPreference: EBackupPreference.unknown,
				isBackedUp: false
			});

			if (saveRes.isErr()) {
				return err(i18n.t('pubkyErrors.failedToSavePubky'));
			}

			// Set the homeserver
			dispatch(setHomeserver({ pubky, homeserver }));

			// Sign up to homeserver with invite code
			const signupRes = await signUpToHomeserver({
				pubky,
				secretKey,
				homeserver,
				signupToken: inviteCode,
				dispatch,
			});

			if (signupRes.isErr()) {
				console.log('Signup failed, attempting signin...');
				// If signup fails, try to sign in (in case it's an existing pubky)
				const signinRes = await signInToHomeserver({
					pubky,
					homeserver,
					secretKey,
					dispatch,
				});

				if (signinRes.isErr()) {
					console.error('Signin also failed:', signinRes.error);
					return err(i18n.t('pubkyErrors.invalidInviteCode'));
				}
				console.log('Signin succeeded');
			} else {
				console.log('Signup succeeded');
			}
			return ok({ pubky });
		} finally {
			dispatch(removeProcessing({ pubky }));
		}
	} catch (error) {
		console.error('Error creating pubky with invite code:', error);
		return err(i18n.t('errors.failedToCreatePubkyWithInvite'));
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
			try {
				const secretKeyRes = await getKeychainValue({ key: pubky });
				if (secretKeyRes.isOk()) {
					const isMigrated = isNewFormat(pubky);
					if (isMigrated) {
						const { secretKey, mnemonic } = JSON.parse(secretKeyRes.value) as IKeychainData;
						// Restored pubkys were already backed up
						await savePubky({ secretKey, pubky, dispatch, mnemonic });
					} else {
						const migrationRes = await migrateKeychainEntry(pubky, secretKeyRes.value);
						if (migrationRes.isOk()) {
							// Restored pubkys were already backed up
							await savePubky({
								secretKey: migrationRes.value.secretKey,
								pubky,
								dispatch,
								mnemonic: migrationRes.value.mnemonic,
							});
						}
					}
				}
			} catch {}
		}
	}
	return allKeys;
};

export const getProfileAvatar = async (pubky: string, app: string = 'pubky.app'): Promise<Result<string>> => {
	try {
		const profileUrl = `pubky://${pubky}/pub/${app}/profile.json`;
		let profile = await get(profileUrl);
		if (profile.isErr()) {
			return err(profile.error.message);
		}
		const profileData = JSON.parse(profile.value);

		const imageSrc = await get(profileData.image);
		if (imageSrc.isErr()) {
			return err(imageSrc.error.message);
		}
		const imageSrcData = JSON.parse(imageSrc.value);

		const image = await get(imageSrcData.src);
		if (image.isErr()) {
			return err(image.error.message);
		}

		if (image.value.startsWith('base64:')) {
			// Handle binary data (image)
			const base64Data = image.value.substring(7); // Remove "base64:" prefix
			const dataUri = `data:image/jpeg;base64,${base64Data}`;
			return ok(dataUri);
		}
		return err(i18n.t('pubkyErrors.expectedImageData'));
	} catch (e) {
		return err(JSON.stringify(e));
	}
};

export const getProfileInfo = async (pubky: string, app: string = 'pubky.app'): Promise<Result<TProfile>> => {
	try {
		const profileUrl = `pubky://${pubky}/pub/${app}/profile.json`;
		let profile = await get(profileUrl);
		if (profile.isErr()) {
			return err(profile.error.message);
		}
		const profileData = JSON.parse(profile.value);
		if (!profileData.name) {
			return ok(defaultProfile);
		}
		return ok(profileData);
	} catch (e) {
		return err(JSON.stringify(e));
	}
};

export const importPubky = async ({
	secretKey,
	dispatch,
	mnemonic = '',
}: {
	secretKey: string;
	dispatch: Dispatch;
	mnemonic?: string;
}): Promise<Result<string>> => {
	try {
		const pubkyRes = await getPublicKeyFromSecretKey(secretKey);
		if (pubkyRes.isErr()) {
			console.error('Failed to get public key from secret key');
			return err(i18n.t('pubkyErrors.failedToGetPublicKey'));
		}
		const pubky = pubkyRes.value.public_key;
		let homeserver = defaultPubkyState.homeserver;
		const getHomeserverRes = await getHomeserver(pubky);
		if (getHomeserverRes.isOk() && getHomeserverRes.value && !getHomeserverRes.value.toLowerCase().includes('error') && !getHomeserverRes.value.toLowerCase().includes('no homeserver')) {
			homeserver = getHomeserverRes.value;
		}
		signInToHomeserver({ pubky, homeserver, dispatch, secretKey }).then((res) => {
			if (res.isErr()) {
				dispatch(setSignedUp({ pubky, signedUp: false }));
			}
		});
		const backupPreference = mnemonic ? EBackupPreference.recoveryPhrase : EBackupPreference.encryptedFile;
		const savePubkyRes = await savePubky({ secretKey, pubky, dispatch, mnemonic, backupPreference, isBackedUp: true });
		if (savePubkyRes.isOk()) {
			// Only set homeserver if we have a valid non-empty value
			if (homeserver?.trim()) {
				dispatch(setHomeserver({ pubky, homeserver }));
			}
			// If they're using Synonym's default or staging homeserver, fetch the profile name and set it accordingly.
			if (homeserver === DEFAULT_HOMESERVER || homeserver === STAGING_HOMESERVER) {
				const app = homeserver === DEFAULT_HOMESERVER ? 'pubky.app' : 'staging.pubky.app';
				const profileInfo = await getProfileInfo(pubky, app);
				if (profileInfo.isOk() && profileInfo.value.name) {
					dispatch(setPubkyData({
						pubky,
						data: {
							name: profileInfo.value.name,
						},
					}));
				}
			}
		}
		return savePubkyRes;
	} catch (error) {
		console.error('Error saving pubky:', error);
		return err(i18n.t('pubkyErrors.errorSavingPubky'));
	}
};

export const savePubky = async ({
	secretKey,
	pubky,
	dispatch,
	mnemonic = '',
	backupPreference = EBackupPreference.unknown,
	isBackedUp = false,
}: {
	secretKey: string,
	pubky: string,
	dispatch: Dispatch,
	mnemonic?: string,
	backupPreference?: EBackupPreference;
	isBackedUp?: boolean;
}): Promise<Result<string>> => {
	try {
		// Ensure the mnemonic phrase generates the expected secretKey
		if (mnemonic) {
			const res = await mnemonicPhraseToKeypair(mnemonic);
			if (res.isErr()) {
				return err(res.error.message);
			}
			if (res.value.secret_key !== secretKey) {
				return err(i18n.t('pubkyErrors.mnemonicDoesNotMatchSecretKey'));
			}
			if (res.value.public_key !== pubky) {
				return err(i18n.t('pubkyErrors.mnemonicDoesNotMatchPubky'));
			}
		} else {
			// If no mnemonic is provided we have to default to the encrypted file.
			backupPreference = EBackupPreference.encryptedFile;
		}
		dispatch(addPubky({ pubky, backupPreference, isBackedUp }));
		const keychainData: IKeychainData = {
			secretKey,
			mnemonic,
		};
		// Don't await this, we don't want to block the UI for devices with slower Keychains.
		setKeychainValue({
			key: pubky,
			value: JSON.stringify(keychainData),
		}).then((response) => {
			if (response.isErr()) {
				console.error('Failed to save keychain value');
				showToast({
					type: 'error',
					title: i18n.t('pubkyErrors.failedToSaveToKeychain'),
					description: response.error.message,
				});
				deletePubky(pubky, dispatch).then();
			}
		});
		return ok(pubky);
	} catch (e) {
		console.error('Error saving pubky:', e);
		return err(i18n.t('pubkyErrors.errorSavingPubky'));
	}
};

/**
 * Checks if a keychain value is in the new JSON format for mnemonic phrases
 */
const isNewFormat = (value: string): boolean => {
	try {
		const parsed = JSON.parse(value);
		return 'secretKey' in parsed && 'mnemonic' in parsed;
	} catch {
		return false;
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
					title: i18n.t('pubkyErrors.failedToDelete'),
					description: response.error.message,
				});
				console.error('Failed to delete pubky from keychain');
			}
		});
		return ok(pubky);
	} catch (error) {
		console.error('Error deleting pubky:', error);
		return err(i18n.t('pubkyErrors.errorDeletingPubky'));
	}
};

/**
 * Migrates a single keychain entry from old format to new format
 */
const migrateKeychainEntry = async (
	pubky: string,
	oldSecretKey: string
): Promise<Result<IKeychainData>> => {
	try {
		// Create new format data
		const keychainData: IKeychainData = {
			secretKey: oldSecretKey,
			mnemonic: '', // Empty mnemonic for migrated entries
		};

		// Save in new format
		const saveRes = await setKeychainValue({
			key: pubky,
			value: JSON.stringify(keychainData),
		});

		if (saveRes.isErr()) {
			return err(`Failed to migrate keychain entry for ${pubky}: ${saveRes.error.message}`);
		}

		return ok(keychainData);
	} catch (error) {
		return err(`Error migrating keychain entry: ${error}`);
	}
};

export const getPubkySecretKey = async (pubky: string): Promise<Result<IKeychainData>> => {
	try {
		const res = await getKeychainValue({ key: pubky });
		if (res.isErr()) {
			console.error('Failed to get secret key from keychain');
			return err(i18n.t('pubkyErrors.failedToGetSecretKeyFromKeychain'));
		}
		if (!res?.value) {
			console.error('Secret key not found in keychain');
			return err(i18n.t('pubkyErrors.secretKeyNotFoundInKeychain'));
		}
		const isMigrated = isNewFormat(res.value);
		if (isMigrated) {
			return ok(JSON.parse(res.value));
		}

		return await migrateKeychainEntry(pubky, res.value);
	} catch {
		return err(i18n.t('pubkyErrors.unableToGetSecretKey'));
	}
};

export const signUpToHomeserver = async ({
	pubky,
	secretKey,
	homeserver,
	signupToken = '',
	dispatch,
}: {
	pubky: string;
	secretKey?: string;
	homeserver: string;
	signupToken?: string;
	dispatch: Dispatch;
}): Promise<Result<SessionInfo>> => {
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			return err(secretKeyRes.error.message);
		}
		secretKey = secretKeyRes.value.secretKey;
	}
	const signUpRes = await signUp(secretKey, homeserver, signupToken);
	if (signUpRes.isErr()) {
		return err(getErrorMessage(signUpRes.error, i18n.t('errors.signupFailed')));
	}
	republishHomeserver({
		pubky,
		secretKey,
		homeserver,
		dispatch,
	});
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
	homeserver?: string;
	dispatch: Dispatch;
	secretKey?: string;
}): Promise<Result<SessionInfo>> => {
	if (!homeserver) {
		const pubkyData = getPubkyDataFromStore(pubky);
		homeserver = pubkyData?.homeserver ?? DEFAULT_HOMESERVER;
		if (!homeserver) {
			return err(i18n.t('pubkyErrors.homeserverNotFound'));
		}
	}
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			return err(getErrorMessage(secretKeyRes.error, i18n.t('errors.failedToGetSecretKey')));
		}
		secretKey = secretKeyRes.value.secretKey;
	}
	let response: SessionInfo;
	const signInRes = await signIn(secretKey);
	if (signInRes.isErr()) {
		const republishRes = await republishHomeserver({
			pubky,
			secretKey,
			homeserver,
			dispatch,
		});
		if (republishRes.isErr()) {
			// If we also get an error from signUp, return the initial signIn response error.
			return err(getErrorMessage(signInRes.error, i18n.t('errors.signInFailed')));
		}
		// Attempt to signin now
		const signInResTwo = await signIn(secretKey);
		if (signInResTwo.isErr()) {
			return err(getErrorMessage(signInResTwo.error, i18n.t('errors.signInFailed')));
		}
		response = signInResTwo.value;
	} else {
		response = signInRes.value;
	}
	dispatch(addSession({
		pubky,
		session: {
			...response,
			created_at: Date.now(),
		},
	}));
	dispatch(setSignedUp({ pubky, signedUp: true }));
	return ok(response);
};

export const signOutOfHomeserver = async (pubky: string, sessionSecret: string, dispatch: Dispatch): Promise<void> => {
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) {
		return;
	}
	const signOutRes = await signOut(sessionSecret);
	if (signOutRes.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('pubkyErrors.failedToSignOut'),
			description: signOutRes.error.message,
		});
		return;
	}
	dispatch(setSignedUp({ pubky, signedUp: false }));
	dispatch(removeSession({ pubky }));
};

export const truncateStr = (str: string, displayLength: number = 5): string => {
	const minLength = displayLength * 2;

	if (str.length <= minLength) {
		return str;
	}
	return `${str.substring(0, displayLength)}...${str.substring(str.length - displayLength)}`;
};

export const truncatePubky = (pubky: string): string => {
	const res = truncateStr(pubky);
	return res.startsWith('pk:') ? res.slice(3) : res;
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
	pubky?: string;
	authUrl: string;
	dispatch: Dispatch;
}): Promise<Result<string>> => {
	try {
		const authPromise = (async (): Promise<Result<string>> => {
			if (!pubky) {
				return err(i18n.t('pubkyErrors.pubkyRequiredForAuth'));
			}
			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				return err(i18n.t('pubkyErrors.failedToGetSecretKey'));
			}
			const pubkyData = getPubkyDataFromStore(pubky);
			const { signedUp, homeserver } = pubkyData;
			if (!signedUp) {
				await signUpToHomeserver({
					pubky,
					secretKey: secretKeyRes.value.secretKey,
					homeserver,
					dispatch,
				});
			}
			const secretKey = secretKeyRes.value.secretKey;
			const authRes = await auth(authUrl, secretKey);
			if (authRes.isErr()) {
				const signInRes = await signInToHomeserver({
					pubky,
					homeserver,
					dispatch,
					secretKey,
				});
				if (signInRes.isErr()) {
					return err(getErrorMessage(signInRes.error, i18n.t('errors.signInFailed')));
				}
				const authRetryRes = await auth(authUrl, secretKey);
				if (authRetryRes.isErr()) {
					console.error('Error processing auth:', authRes.error);
					return err(getErrorMessage(authRes.error, i18n.t('errors.failedToProcessAuth')));
				}
			}
			return ok('success');
		})();

		const timeoutPromise = timeout(TIMEOUT_MS).then(
			(): Result<string> => err(i18n.t('auth.timeoutError'))
		);

		return await Promise.race([authPromise, timeoutPromise]);
	} catch (error: unknown) {
		console.error('Auth Error:', error);
		const errorMessage = error instanceof Error
			? error.message
			: i18n.t('pubkyErrors.authorizationError');
		return err(`Auth Error: ${errorMessage}`);
	}
};
