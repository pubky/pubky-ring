import { normalizeHomeserver } from './homeservers';
import { HomeserverChangedError } from './homeserverChangedError';
import { resolveHomeserver } from './resolveHomeserver';
import { AppState, Platform } from 'react-native';
import {
	assertNotAborted,
	DeviceAuthError,
	isDeviceAuthPromptActive,
	isDeviceAuthRequired,
	requireDeviceAuthentication,
	waitForActiveRequest,
} from './deviceAuth';
import {
	signUp,
	signIn,
	signOut,
	getPublicKeyFromSecretKey,
	getSignupToken as _getSignupToken,
	republishHomeserver as _republishHomeserver,
	getHomeserver,
	get,
	auth,
	authWithCapabilities,
	generateMnemonicPhraseAndKeypair,
	mnemonicPhraseToKeypair,
	type SessionInfo,
} from '@synonymdev/react-native-pubky';
import * as ReactNativePubky from '@synonymdev/react-native-pubky';
import {
	setKeychainValue,
	resetKeychainValue,
	getKeychainValue,
	setSessionSecret,
	getSessionSecret,
	resetSessionSecret,
	resetPubkySessionSecrets,
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
import { v5 as uuid } from 'uuid';
import { defaultProfile, defaultPubkyState } from '../store/shapes/pubky';
import { checkNetworkConnection } from './helpers.ts';
import { showToast } from '@synonymdev/react-native-toast';
import { getErrorMessage } from './errorHandler.ts';
import { getAllPubkysFromStore, getPubkyDataFromStore } from './store-helpers.ts';
import { EBackupPreference, GrantInfo, IKeychainData, PubkySession, TProfile } from '../types/pubky.ts';
import type { TPubkys } from '../types/pubky.ts';
import {
	DEFAULT_HOMESERVER,
	PRODUCTION_APP_HOST,
	PRODUCTION_HOMESERVER,
	STAGING_APP_HOST,
	STAGING_HOMESERVER,
} from './constants.ts';
import { appApplicationId } from './appInfo.ts';
import {
	getExternalSecretKey,
	listExternalPubkys,
	publishOwnedPubky,
	unpublishOwnedPubky,
} from './sharedPubky.ts';
import i18n from '../i18n';

type GrantManagementBindings = {
	listGrants?: (sessionSecret: string) => Promise<Result<GrantInfo[]>>;
	revokeGrant?: (sessionSecret: string, grantId: string) => Promise<Result<string>>;
};

const grantManagementBindings = ReactNativePubky as typeof ReactNativePubky & GrantManagementBindings;

const grantManagementUnavailable = (method: keyof GrantManagementBindings): string => {
	console.error(`@synonymdev/react-native-pubky does not expose ${method}`);
	return i18n.t('pubkyErrors.unexpectedError');
};

const listGrants = (sessionSecret: string): Promise<Result<GrantInfo[]>> => {
	if (!grantManagementBindings.listGrants) {
		return Promise.resolve(err(grantManagementUnavailable('listGrants')));
	}
	return grantManagementBindings.listGrants(sessionSecret);
};

const revokeGrant = (sessionSecret: string, grantId: string): Promise<Result<string>> => {
	if (!grantManagementBindings.revokeGrant) {
		return Promise.resolve(err(grantManagementUnavailable('revokeGrant')));
	}
	return grantManagementBindings.revokeGrant(sessionSecret, grantId);
};

const omitLocalGrants = (grants: GrantInfo[], localGrantIds: string[]): GrantInfo[] => {
	const knownGrantIds = new Set(localGrantIds);
	return grants.filter(grant => !knownGrantIds.has(grant.grant_id));
};

// Stable UUID v5 namespace for deriving local session ids from homeserver session tokens.
const SESSION_ID_NAMESPACE = '4dd6b3f6-1ef1-4e8a-9a7b-4bbdb8b69785';

export type RepublishAllHomeserverRecordsSummary = {
	total: number;
	succeeded: number;
	failed: number;
	skipped: number;
};

export type AuthorizedGrants = {
	grants: GrantInfo[];
	sessionId: string;
};

export type HomeserverSignOutResult = { homeserver: string; cleanupPending: boolean };

// Serialize refresh and sign-out through every native/Keychain await for the same pubky.
const homeserverOperations = new Map<string, Promise<void>>();
const pendingSignOuts = new Map<string, Promise<Result<HomeserverSignOutResult>>>();
const withHomeserverOperation = async <T>(pubky: string, operation: () => Promise<T>): Promise<T> => {
	const previous = homeserverOperations.get(pubky);
	let release!: () => void;
	const current = new Promise<void>(resolve => {
		release = resolve;
	});
	homeserverOperations.set(pubky, current);
	try {
		await previous;
		return await operation();
	} finally {
		release();
		if (homeserverOperations.get(pubky) === current) homeserverOperations.delete(pubky);
	}
};

const revokeUnsavedHomeserverSession = async (sessionToken: string): Promise<Result<string>> => {
	let signOutRes: Result<string>;
	try {
		signOutRes = await signOut(sessionToken);
	} catch (error) {
		signOutRes = err(getErrorMessage(error, i18n.t('errors.unknownError')));
	}
	if (signOutRes.isErr()) {
		console.error('Failed to revoke unsaved homeserver session', signOutRes.error.message);
	}
	return signOutRes;
};

const saveHomeserverSession = async ({
	pubky,
	sessionInfo,
	dispatch,
	cleanupOnly = false,
}: {
	pubky: string;
	sessionInfo: SessionInfo;
	dispatch: Dispatch;
	cleanupOnly?: boolean;
}): Promise<Result<PubkySession>> => {
	const session: PubkySession = {
		id: uuid(sessionInfo.grant_secret, SESSION_ID_NAMESPACE),
		grant_id: sessionInfo.grant_id,
		capabilities: sessionInfo.capabilities,
		created_at: Date.now(),
		homeserver: normalizeHomeserver(sessionInfo.homeserver),
		...(cleanupOnly ? { cleanupOnly: true } : {}),
	};
	const secretRes = await setSessionSecret({
		pubky,
		sessionId: session.id,
		sessionSecret: sessionInfo.grant_secret,
	});

	if (secretRes.isErr()) {
		await revokeUnsavedHomeserverSession(sessionInfo.grant_secret);
		return err(secretRes.error);
	}

	dispatch(addSession({ pubky, session }));
	return ok(session);
};

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
	if (getPubkyDataFromStore(pubky)?.sourceApp) {
		return err(i18n.t('sharedPubky.homeserverUnsupported'));
	}
	console.log(`[republish] Starting for ${pubky} via ${homeserver}`);
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			console.error(`[republish] Failed to load secret key for ${pubky}:`, secretKeyRes.error.message);
			return err(secretKeyRes.error.message);
		}
		secretKey = secretKeyRes.value.secretKey;
	}
	const res = await _republishHomeserver(secretKey, homeserver);
	if (res.isErr()) {
		console.error(`[republish] Failed for ${pubky} via ${homeserver}:`, res.error.message);
		return err(res.error.message);
	}
	dispatch(setHomeserver({ pubky, homeserver }));
	console.log(`[republish] Succeeded for ${pubky} via ${homeserver}:`, res.value);
	return ok(res.value);
};

export const republishAllHomeserverRecords = async ({
	pubkys,
	dispatch,
}: {
	pubkys: TPubkys;
	dispatch: Dispatch;
}): Promise<RepublishAllHomeserverRecordsSummary> => {
	const summary: RepublishAllHomeserverRecordsSummary = {
		total: Object.keys(pubkys).length,
		succeeded: 0,
		failed: 0,
		skipped: 0,
	};

	console.log(`[republish] Starting batch for ${summary.total} pubkys`);
	const republishablePubkys = Object.entries(pubkys).filter(([pubky, data]) => {
		const hasHomeserver = !!data.homeserver;
		if (!hasHomeserver) {
			console.log(`[republish] Skipping batch item for ${pubky}: no homeserver`);
		}
		return hasHomeserver && !data.sourceApp;
	});
	summary.skipped = summary.total - republishablePubkys.length;

	const results = await Promise.all(
		republishablePubkys.map(async ([pubky, data]) => {
			const res = await republishHomeserver({
				pubky,
				homeserver: data.homeserver,
				dispatch,
			});

			if (res.isErr()) {
				console.error(`[republish] Batch item failed for ${pubky}:`, res.error.message);
			}

			return res;
		}),
	);

	summary.succeeded = results.filter(res => res.isOk()).length;
	summary.failed = results.length - summary.succeeded;

	console.log(
		`[republish] Batch finished: ${summary.succeeded} succeeded, ${summary.failed} failed, ${summary.skipped} skipped`,
	);
	return summary;
};

export const createNewPubky = async (dispatch: Dispatch): Promise<Result<string>> => {
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
			backupPreference: EBackupPreference.unknown,
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
	homeserver: string = DEFAULT_HOMESERVER,
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
				isBackedUp: false,
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
					return err(signupRes.error);
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

const lookupHomeserver = async (pubky: string): Promise<string> => {
	const res = await getHomeserver(pubky);
	if (
		res.isOk() &&
		res.value &&
		!res.value.toLowerCase().includes('error') &&
		!res.value.toLowerCase().includes('no homeserver')
	) {
		return res.value;
	}
	return defaultPubkyState.homeserver;
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
		const backupPreference = mnemonic ? EBackupPreference.recoveryPhrase : EBackupPreference.encryptedFile;
		const savePubkyRes = await savePubky({
			secretKey,
			pubky,
			dispatch,
			mnemonic,
			backupPreference,
			isBackedUp: true,
		});
		if (savePubkyRes.isOk()) {
			const lookup = await resolveHomeserver(pubky);
			// A failed lookup leaves the key imported. Setup can retry discovery.
			if (lookup.isErr() || !lookup.value) return savePubkyRes;
			const homeserver = lookup.value;
			dispatch(setHomeserver({ pubky, homeserver }));
			await signInToHomeserver({ pubky, homeserver, dispatch, secretKey, allowRepublish: false });
			// If they're using Synonym's default or staging homeserver, fetch the profile name and set it accordingly.
			if (homeserver === PRODUCTION_HOMESERVER || homeserver === STAGING_HOMESERVER) {
				const app = homeserver === STAGING_HOMESERVER ? STAGING_APP_HOST : PRODUCTION_APP_HOST;
				const profileInfo = await getProfileInfo(pubky, app);
				if (profileInfo.isOk() && profileInfo.value.name) {
					dispatch(
						setPubkyData({
							pubky,
							data: {
								name: profileInfo.value.name,
							},
						}),
					);
				}
			}
		}
		return savePubkyRes;
	} catch (error) {
		console.error('Error saving pubky:', error);
		return err(i18n.t('pubkyErrors.errorSavingPubky'));
	}
};

/**
 * Adds a pubky owned by another app. Only the reference is stored:
 * the secret key stays with the owning app and is read just in time for signing.
 */
export const adoptExternalPubky = async ({
	pubky,
	sourceApp,
	dispatch,
}: {
	pubky: string;
	sourceApp: string;
	dispatch: Dispatch;
}): Promise<void> => {
	// A stale card can offer a pubky Ring already lists, and adopting it again would relabel it.
	if (getPubkyDataFromStore(pubky)) {
		return;
	}
	const homeserver = await lookupHomeserver(pubky);
	dispatch(addPubky({ pubky, backupPreference: EBackupPreference.unknown, isBackedUp: true }));
	const index = Object.keys(getAllPubkysFromStore()).indexOf(pubky);
	dispatch(
		setPubkyData({
			pubky,
			data: {
				sourceApp,
				name: `pubky #${index + 1} (Bitkit)`,
				signedUp: !!homeserver,
				homeserver,
			},
		}),
	);
};

export const savePubky = async ({
	secretKey,
	pubky,
	dispatch,
	mnemonic = '',
	backupPreference = EBackupPreference.unknown,
	isBackedUp = false,
	signupToken = '',
}: {
	secretKey: string;
	pubky: string;
	dispatch: Dispatch;
	mnemonic?: string;
	backupPreference?: EBackupPreference;
	isBackedUp?: boolean;
	signupToken?: string;
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
		dispatch(addPubky({ pubky, backupPreference, isBackedUp, signupToken }));
		const keychainData: IKeychainData = {
			secretKey,
			mnemonic,
		};
		// Don't await this, we don't want to block the UI for devices with slower Keychains.
		setKeychainValue({
			key: pubky,
			value: JSON.stringify(keychainData),
		}).then(response => {
			if (response.isErr()) {
				console.error('Failed to save keychain value');
				showToast({
					type: 'error',
					title: i18n.t('pubkyErrors.failedToSaveToKeychain'),
					description: response.error.message,
				});
				deletePubky(pubky, dispatch).then();
				return;
			}
			// Ring holds the secret now, so any earlier reference to an owning app is stale.
			dispatch(setPubkyData({ pubky, data: { sourceApp: undefined } }));
			publishOwnedPubky(pubky, secretKey);
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

/** The key belongs to another app, so only the reference and the Ring-owned session secrets are ours to clear. */
const removeExternalPubky = async (pubky: string, dispatch: Dispatch): Promise<void> => {
	dispatch(removePubky(pubky));
	await resetPubkySessionSecrets({ pubky });
};

export const deletePubky = async (pubky: string, dispatch: Dispatch): Promise<Result<string>> => {
	try {
		if (getPubkyDataFromStore(pubky)?.sourceApp) {
			await removeExternalPubky(pubky, dispatch);
			return ok(pubky);
		}
		// The shared record goes first, so a failure keeps the pubky and the delete can be retried.
		const unpublishRes = await unpublishOwnedPubky(pubky);
		if (unpublishRes.isErr()) {
			console.error('Failed to remove the shared pubky record:', unpublishRes.error);
			return err(i18n.t('pubkyErrors.errorDeletingPubky'));
		}
		dispatch(removePubky(pubky));
		// Don't await this, we don't want to block the UI for devices with slower Keychains.
		Promise.all([resetKeychainValue({ key: pubky }), resetPubkySessionSecrets({ pubky })])
			.then(([keychainRes, sessionRes]) => {
				const error = [keychainRes, sessionRes].find(result => result.isErr());
				if (error?.isErr()) {
					showToast({
						type: 'error',
						title: i18n.t('pubkyErrors.failedToDelete'),
						description: error.error.message,
					});
					console.error('Failed to delete pubky data from keychain');
				}
			})
			.catch(error => {
				console.error('Failed to delete pubky data from keychain', error);
			});
		return ok(pubky);
	} catch (error) {
		console.error('Error deleting pubky:', error);
		return err(i18n.t('pubkyErrors.errorDeletingPubky'));
	}
};

/**
 * Publishes a shared record for every pubky this app owns so other apps can use them.
 * Runs on every app start and is idempotent.
 */
export const publishAllOwnedPubkys = async (pubkys: TPubkys): Promise<void> => {
	await Promise.all(
		Object.entries(pubkys).map(async ([pubky, { sourceApp }]) => {
			if (sourceApp) {
				return;
			}
			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isOk()) {
				await publishOwnedPubky(pubky, secretKeyRes.value.secretKey);
			}
		}),
	);
};

/**
 * Removes adopted pubkys whose owning app no longer publishes them.
 * Read failures are ignored so a temporary error never deletes a reference.
 */
export const pruneMissingExternalPubkys = async (pubkys: TPubkys, dispatch: Dispatch): Promise<void> => {
	const externalRes = await listExternalPubkys();
	if (externalRes.isErr()) {
		return;
	}
	const missing = Object.entries(pubkys).filter(
		([pubky, { sourceApp }]) =>
			sourceApp &&
			!externalRes.value.some(record => record.pubky === pubky && record.sourceApp === sourceApp),
	);
	if (missing.length === 0) {
		return;
	}
	await Promise.all(missing.map(([pubky]) => removeExternalPubky(pubky, dispatch)));
	showToast({
		type: 'info',
		title: i18n.t('sharedPubky.sourceLostTitle'),
		description: i18n.t('sharedPubky.sourceLostDescription'),
	});
};

/**
 * Migrates a single keychain entry from old format to new format
 */
const migrateKeychainEntry = async (pubky: string, oldSecretKey: string): Promise<Result<IKeychainData>> => {
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
	const sourceApp = getPubkyDataFromStore(pubky)?.sourceApp;
	if (sourceApp) {
		const externalRes = await getExternalSecretKey(pubky, sourceApp);
		return externalRes.isErr()
			? err(externalRes.error.message)
			: ok({ secretKey: externalRes.value, mnemonic: '' });
	}
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
	if (getPubkyDataFromStore(pubky)?.sourceApp) {
		return err(i18n.t('sharedPubky.homeserverUnsupported'));
	}
	if (!secretKey) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			return err(secretKeyRes.error.message);
		}
		secretKey = secretKeyRes.value.secretKey;
	}
	const signUpRes = await signUp(secretKey, homeserver, signupToken, appApplicationId);
	if (signUpRes.isErr()) {
		return err(getErrorMessage(signUpRes.error, i18n.t('errors.signupFailed')));
	}
	const sessionInfo = signUpRes.value;
	republishHomeserver({
		pubky,
		secretKey,
		homeserver,
		dispatch,
	});
	dispatch(setHomeserver({ pubky, homeserver }));
	const saveSessionRes = await saveHomeserverSession({ pubky, sessionInfo, dispatch });
	if (saveSessionRes.isErr()) {
		return err(getErrorMessage(saveSessionRes.error, i18n.t('keychain.failedToSetValue')));
	}
	dispatch(setSignedUp({ pubky, signedUp: true }));
	return ok(sessionInfo);
};

export const signInToHomeserver = async ({
	pubky,
	homeserver,
	dispatch,
	secretKey,
	allowRepublish = true,
}: {
	pubky: string;
	homeserver?: string;
	dispatch: Dispatch;
	secretKey?: string;
	allowRepublish?: boolean;
}): Promise<Result<SessionInfo>> => {
	if (getPubkyDataFromStore(pubky)?.sourceApp) {
		return err(i18n.t('sharedPubky.homeserverUnsupported'));
	}
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
	const signInRes = await signIn(secretKey, appApplicationId);
	if (signInRes.isErr()) {
		if (!allowRepublish) return err(signInRes.error);
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
		const signInResTwo = await signIn(secretKey, appApplicationId);
		if (signInResTwo.isErr()) {
			return err(getErrorMessage(signInResTwo.error, i18n.t('errors.signInFailed')));
		}
		response = signInResTwo.value;
	} else {
		response = signInRes.value;
	}
	const actualHomeserver = normalizeHomeserver(response.homeserver);
	if (!allowRepublish && actualHomeserver !== normalizeHomeserver(homeserver)) {
		const cleanup = await revokeUnsavedHomeserverSession(response.grant_secret);
		if (cleanup.isErr()) {
			const saved = await saveHomeserverSession({
				pubky,
				sessionInfo: response,
				dispatch,
				cleanupOnly: true,
			});
			if (saved.isErr()) return err(saved.error);
		}
		if (actualHomeserver) {
			return err(new HomeserverChangedError(actualHomeserver, i18n.t('homeservers.accountChanged')));
		}
		return err(i18n.t('homeservers.accountChanged'));
	}
	const saveSessionRes = await saveHomeserverSession({ pubky, sessionInfo: response, dispatch });
	if (saveSessionRes.isErr()) {
		return err(getErrorMessage(saveSessionRes.error, i18n.t('keychain.failedToSetValue')));
	}
	dispatch(setSignedUp({ pubky, signedUp: true }));
	return ok(response);
};

const isInvalidStoredSessionError = (message: string): boolean =>
	message.includes('Session is no longer valid') || message.includes('Failed to import session');

const discardStoredSession = async ({
	pubky,
	sessionId,
	dispatch,
}: {
	pubky: string;
	sessionId: string;
	dispatch: Dispatch;
}): Promise<void> => {
	const resetResult = await resetSessionSecret({ pubky, sessionId });
	if (resetResult.isErr()) {
		console.error('Failed to clear invalid homeserver session', resetResult.error.message);
	}
	dispatch(removeSession({ pubky, sessionId }));
};

const listGrantsWithStoredSession = async (
	pubky: string,
	dispatch: Dispatch,
): Promise<Result<AuthorizedGrants> | undefined> => {
	const data = getPubkyDataFromStore(pubky);
	const sessions = data?.sessions ?? [];
	const homeserver = normalizeHomeserver(data?.homeserver);
	const storedGrantIds = sessions.map(session => session.grant_id);
	let transientError: Error | undefined;

	for (const session of sessions) {
		const sessionHomeserver = normalizeHomeserver(session.homeserver);
		if (session.cleanupOnly || (sessionHomeserver && sessionHomeserver !== homeserver)) continue;
		const sessionSecretRes = await getSessionSecret({ pubky, sessionId: session.id });
		if (sessionSecretRes.isErr()) {
			transientError = sessionSecretRes.error;
			continue;
		}

		const grantsRes = await listGrants(sessionSecretRes.value);
		if (grantsRes.isOk()) {
			return ok({
				grants: omitLocalGrants(grantsRes.value, storedGrantIds),
				sessionId: session.id,
			});
		}

		const revalidateResult = await ReactNativePubky.revalidateSession(sessionSecretRes.value);
		if (revalidateResult.isErr() && isInvalidStoredSessionError(revalidateResult.error.message)) {
			await discardStoredSession({ pubky, sessionId: session.id, dispatch });
			continue;
		}

		transientError = grantsRes.error;
	}

	return transientError ? err(transientError) : undefined;
};

export const listAuthorizedGrants = async ({
	pubky,
	dispatch,
}: {
	pubky: string;
	dispatch: Dispatch;
}): Promise<Result<AuthorizedGrants>> => {
	if (pendingSignOuts.has(pubky)) return err(i18n.t('homeservers.signInRequired'));
	return withHomeserverOperation(pubky, async () => {
		if (pendingSignOuts.has(pubky) || !getPubkyDataFromStore(pubky)?.signedUp) {
			return err(i18n.t('homeservers.signInRequired'));
		}
		if (!grantManagementBindings.listGrants) {
			return err(grantManagementUnavailable('listGrants'));
		}

		const storedResult = await listGrantsWithStoredSession(pubky, dispatch);
		if (storedResult) {
			return storedResult;
		}

		const signInRes = await signInToHomeserver({ pubky, dispatch });
		if (signInRes.isErr()) {
			return err(signInRes.error);
		}
		// Native sign-in follows the public mapping. Reuse that server's session on
		// subsequent refreshes, even if listing its grants fails this time.
		const homeserver = normalizeHomeserver(signInRes.value.homeserver);
		if (homeserver) {
			dispatch(setPubkyData({ pubky, data: { homeserver, lastKnownHomeserver: homeserver } }));
		}

		const grantsRes = await listGrants(signInRes.value.grant_secret);
		if (grantsRes.isErr()) {
			return err(grantsRes.error);
		}

		return ok({
			grants: omitLocalGrants(grantsRes.value, [
				...(getPubkyDataFromStore(pubky)?.sessions ?? []).map(session => session.grant_id),
				signInRes.value.grant_id,
			]),
			sessionId: uuid(signInRes.value.grant_secret, SESSION_ID_NAMESPACE),
		});
	});
};

export const revokeAuthorizedGrant = async ({
	pubky,
	sessionId,
	grantId,
}: {
	pubky: string;
	sessionId: string;
	grantId: string;
}): Promise<Result<string>> => {
	if (!grantManagementBindings.revokeGrant) {
		return err(grantManagementUnavailable('revokeGrant'));
	}

	const sessionSecretRes = await getSessionSecret({ pubky, sessionId });
	if (sessionSecretRes.isErr()) {
		return sessionSecretRes;
	}

	return revokeGrant(sessionSecretRes.value, grantId);
};

type HomeserverSignOutArgs = { pubky: string; homeserver: string; dispatch: Dispatch };

// These SDK restore errors refer to the grant's signed expiry, not its bearer token.
const isExpiredGrantError = (error: Error): boolean =>
	['stored grant credential has expired', 'delegated grant credential has expired'].some(message =>
		error.message.toLowerCase().includes(message),
	);

const signOutRingFromHomeserverOnce = async ({
	pubky,
	homeserver,
	dispatch,
}: HomeserverSignOutArgs): Promise<Result<HomeserverSignOutResult>> => {
	const data = getPubkyDataFromStore(pubky);
	if (!data || data.sourceApp) return err(i18n.t('sharedPubky.homeserverUnsupported'));
	if (!normalizeHomeserver(homeserver)) return err(i18n.t('pubkyErrors.homeserverNotFound'));
	if (!grantManagementBindings.listGrants || !grantManagementBindings.revokeGrant) {
		return err(grantManagementUnavailable('revokeGrant'));
	}
	const secret = await getPubkySecretKey(pubky);
	if (secret.isErr()) return err(secret.error);
	// Follow the public mapping without republishing it, including moves made in another client.
	const signedIn = await signIn(secret.value.secretKey, appApplicationId);
	if (signedIn.isErr()) return err(signedIn.error);
	const management = signedIn.value;
	const mappedHomeserver = normalizeHomeserver(management.homeserver);
	if (!mappedHomeserver) {
		const cleanup = await revokeUnsavedHomeserverSession(management.grant_secret);
		if (cleanup.isErr()) {
			const saved = await saveHomeserverSession({
				pubky,
				sessionInfo: management,
				dispatch,
				cleanupOnly: true,
			});
			if (saved.isErr()) return err(saved.error);
		}
		return err(i18n.t('pubkyErrors.homeserverNotFound'));
	}
	// Keep the temporary management grant available if any current-server operation fails.
	const saved = await saveHomeserverSession({ pubky, sessionInfo: management, dispatch });
	if (saved.isErr()) return err(saved.error);
	const records = new Map([...(data.sessions ?? []), saved.value].map(session => [session.id, session]));
	const forget = async (ids: string[]): Promise<void> => {
		for (const sessionId of ids) {
			await discardStoredSession({ pubky, sessionId, dispatch });
			records.delete(sessionId);
		}
	};
	const grants = await listGrants(management.grant_secret);
	if (grants.isErr()) return err(grants.error);
	const currentGrantIds = new Set(grants.value.map(grant => grant.grant_id));
	const currentSessions = [...records.values()].filter(session => {
		const server = normalizeHomeserver(session.homeserver);
		return server === mappedHomeserver || (!server && currentGrantIds.has(session.grant_id));
	});
	const currentSessionIds = new Set(currentSessions.map(session => session.id));

	// Other servers and unmatched legacy records use their own tokens. Uncertain failures
	// become cleanup-only records; they must not prevent the current server's sign-out.
	for (const session of [...records.values()]) {
		if (!records.has(session.id) || currentSessionIds.has(session.id)) continue;
		const token = await getSessionSecret({ pubky, sessionId: session.id });
		const cleanup = token.isErr()
			? err<string>(token.error)
			: await revokeUnsavedHomeserverSession(token.value);
		if (cleanup.isOk() || (token.isOk() && isExpiredGrantError(cleanup.error))) {
			const server = normalizeHomeserver(session.homeserver);
			const ids = server
				? [...records.values()]
						.filter(
							record =>
								record.grant_id === session.grant_id && normalizeHomeserver(record.homeserver) === server,
						)
						.map(record => record.id)
				: [session.id];
			await forget(ids);
		} else {
			records.set(session.id, { ...session, cleanupOnly: true });
			dispatch(setPubkyData({ pubky, data: { sessions: [...records.values()] } }));
		}
	}
	const forgetCurrentGrant = (grantId: string): Promise<void> =>
		forget(currentSessions.filter(session => session.grant_id === grantId).map(session => session.id));
	for (const grantId of new Set(currentSessions.map(session => session.grant_id))) {
		if (grantId === management.grant_id) continue;
		if (currentGrantIds.has(grantId)) {
			const revoked = await revokeGrant(management.grant_secret, grantId);
			if (revoked.isErr()) return err(revoked.error);
		}
		// Absence is authoritative only for records tied to this server.
		await forgetCurrentGrant(grantId);
	}
	const revokedManagement = await revokeGrant(management.grant_secret, management.grant_id);
	if (revokedManagement.isErr()) return err(revokedManagement.error);
	await forgetCurrentGrant(management.grant_id);
	const pending = [...records.values()];
	const cleared = await resetPubkySessionSecrets({
		pubky,
		...(pending.length ? { keepSessionIds: pending.map(session => session.id) } : {}),
	});
	if (cleared.isErr()) return err(cleared.error);
	dispatch(
		setPubkyData({
			pubky,
			data: {
				homeserver: mappedHomeserver,
				lastKnownHomeserver: mappedHomeserver,
				signedUp: false,
				signupToken: '',
				sessions: pending,
			},
		}),
	);
	return ok({ homeserver: mappedHomeserver, cleanupPending: pending.length > 0 });
};

/** Revoke this installation's Ring grants after draining any active grant refresh. */
export const signOutRingFromHomeserver = (
	args: HomeserverSignOutArgs,
): Promise<Result<HomeserverSignOutResult>> => {
	const pending = pendingSignOuts.get(args.pubky);
	if (pending) return pending;
	const request = withHomeserverOperation(args.pubky, () => signOutRingFromHomeserverOnce(args));
	pendingSignOuts.set(args.pubky, request);
	return request.finally(() => pendingSignOuts.delete(args.pubky));
};

export const revokeHomeserverSession = async (
	pubky: string,
	sessionId: string,
	dispatch: Dispatch,
): Promise<void> => {
	const sessionSecretRes = await getSessionSecret({ pubky, sessionId });
	if (sessionSecretRes.isErr()) {
		return;
	}
	const signOutRes = await signOut(sessionSecretRes.value);
	if (signOutRes.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('pubkyErrors.failedToSignOut'),
			description: signOutRes.error.message,
		});
		return;
	}
	await resetSessionSecret({ pubky, sessionId });
	dispatch(removeSession({ pubky, sessionId }));
};

export const signOutOfHomeserver = async (
	pubky: string,
	sessionId: string,
	dispatch: Dispatch,
): Promise<void> => {
	await revokeHomeserverSession(pubky, sessionId, dispatch);
	dispatch(setSignedUp({ pubky, signedUp: false }));
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

export const performAuth = async ({
	pubky,
	authUrl,
	dispatch,
	approvedCapabilities,
	signal,
}: {
	pubky?: string;
	authUrl: string;
	dispatch: Dispatch;
	approvedCapabilities?: string;
	signal?: AbortSignal;
}): Promise<Result<string>> => {
	const request = new AbortController();
	const abort = (): void => request.abort();
	signal?.addEventListener('abort', abort, { once: true });
	if (signal?.aborted) abort();
	const cancelInBackground = (): void => {
		if (!isDeviceAuthPromptActive(request.signal)) abort();
	};
	const subscription = AppState.addEventListener('change', state => {
		if (state === 'background') cancelInBackground();
	});
	const blurSubscription =
		Platform.OS === 'android' && isDeviceAuthRequired()
			? AppState.addEventListener('blur', cancelInBackground)
			: undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let timedOut = false;
	const checkActive = (): void => {
		assertNotAborted(request.signal);
		if (pubky && !getPubkyDataFromStore(pubky)) throw new DeviceAuthError('cancelled');
	};
	try {
		if (!pubky) return err(i18n.t('pubkyErrors.pubkyRequiredForAuth'));
		checkActive();
		await requireDeviceAuthentication(
			i18n.t('deviceAuth.authorize', { pubky: truncatePubky(pubky) }),
			request.signal,
		);
		checkActive();
		// The network deadline begins after the user completes the OS challenge.
		timer = setTimeout(() => {
			timedOut = true;
			abort();
		}, TIMEOUT_MS);
		const isOnline = await waitForActiveRequest(
			checkNetworkConnection({
				displayToastIfOnline: false,
				displayToastIfOffline: false,
			}),
			request.signal,
		);
		if (!isOnline) {
			return err(i18n.t('network.offlineDescription'));
		}
		checkActive();
		const authPromise = (async (): Promise<Result<string>> => {
			if (!pubky) {
				return err(i18n.t('pubkyErrors.pubkyRequiredForAuth'));
			}
			checkActive();
			const secretKeyRes = await getPubkySecretKey(pubky);
			checkActive();
			if (secretKeyRes.isErr()) {
				return err(i18n.t('pubkyErrors.failedToGetSecretKey'));
			}
			const pubkyData = getPubkyDataFromStore(pubky);
			const { signedUp, homeserver } = pubkyData;
			let republishedDuringSignup = false;
			if (!signedUp) {
				const signUpRes = await signUpToHomeserver({
					pubky,
					secretKey: secretKeyRes.value.secretKey,
					homeserver,
					dispatch,
				});
				republishedDuringSignup = signUpRes.isOk();
			}
			checkActive();
			const secretKey = secretKeyRes.value.secretKey;
			const authorize = (): Promise<Result<string>> | Promise<Result<string[]>> => {
				checkActive();
				return approvedCapabilities === undefined
					? auth(authUrl, secretKey)
					: authWithCapabilities(authUrl, secretKey, approvedCapabilities);
			};
			const authRes = await authorize();
			checkActive();
			if (authRes.isErr()) {
				const signInRes = await signInToHomeserver({
					pubky,
					homeserver,
					dispatch,
					secretKey,
				});
				checkActive();
				if (signInRes.isErr()) {
					return err(getErrorMessage(signInRes.error, i18n.t('errors.signInFailed')));
				}
				const authRetryRes = await authorize();
				checkActive();
				if (authRetryRes.isErr()) {
					console.error('Error processing auth:', authRes.error);
					return err(getErrorMessage(authRes.error, i18n.t('errors.failedToProcessAuth')));
				}
			}
			if (!republishedDuringSignup && homeserver) {
				republishHomeserver({ pubky, secretKey, homeserver, dispatch });
			}
			return ok('success');
		})();

		return await waitForActiveRequest(authPromise, request.signal);
	} catch (error: unknown) {
		if (timedOut) return err(i18n.t('auth.timeoutError'));
		if (error instanceof DeviceAuthError) return err(error);
		console.error('Auth Error:', error);
		const errorMessage = error instanceof Error ? error.message : i18n.t('pubkyErrors.authorizationError');
		return err(`Auth Error: ${errorMessage}`);
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', abort);
		subscription.remove();
		blurSubscription?.remove();
	}
};
