import {
	signUp,
	signIn,
	signOut,
	getPublicKeyFromSecretKey,
	getSignupToken as _getSignupToken,
	republishHomeserver as _republishHomeserver,
	getHomeserver,
	get,
	generateMnemonicPhraseAndKeypair,
	mnemonicPhraseToKeypair,
	type SessionInfo,
} from '@synonymdev/react-native-pubky';
import {
	setKeychainValue,
	resetKeychainValue,
	getKeychainValue,
	getAllKeychainKeys,
	setSessionSecret,
	getSessionSecret,
	resetSessionSecret,
	resetPubkySessionSecrets,
	wipeKeychain,
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
import { auth } from '@synonymdev/react-native-pubky';
import { getPubkyDataFromStore } from './store-helpers.ts';
import { EBackupPreference, IKeychainData, PubkySession, TProfile } from '../types/pubky.ts';
import type { TPubkys } from '../types/pubky.ts';
import {
	DEFAULT_HOMESERVER,
	PRODUCTION_APP_HOST,
	PRODUCTION_HOMESERVER,
	STAGING_APP_HOST,
	STAGING_HOMESERVER,
} from './constants.ts';
import { appApplicationId } from './appInfo.ts';
import i18n from '../i18n';
import {
	BITKIT_SOURCE_APP,
	clearOwnedSharedPubkys,
	getSharedPubkyCredential,
	isValidSharedSecretKey,
	mirrorSharedPubky,
	normalizeSharedPubky,
	privatePubkyService,
	reconcileSharedPubkys,
	removeSharedPubky,
	RING_SOURCE_APP,
	SharedPubkyIdentity,
	withPubkyIdentityLifecycle,
} from './sharedPubky.ts';
import { store } from '../store';
import { removeDisconnectedPubkyDetail } from '../sheets/sheetNavigation.tsx';

// Stable UUID v5 namespace for deriving local session ids from homeserver session tokens.
const SESSION_ID_NAMESPACE = '4dd6b3f6-1ef1-4e8a-9a7b-4bbdb8b69785';

export type RepublishAllHomeserverRecordsSummary = {
	total: number;
	succeeded: number;
	failed: number;
	skipped: number;
};

const revokeUnsavedHomeserverSession = async (sessionToken: string): Promise<void> => {
	const signOutRes = await signOut(sessionToken);
	if (signOutRes.isErr()) {
		console.error('Failed to revoke unsaved homeserver session', signOutRes.error.message);
	}
};

const saveHomeserverSession = async ({
	pubky,
	sessionInfo,
	dispatch,
}: {
	pubky: string;
	sessionInfo: SessionInfo;
	dispatch: Dispatch;
}): Promise<Result<PubkySession>> => {
	const session: PubkySession = {
		id: uuid(sessionInfo.grant_secret, SESSION_ID_NAMESPACE),
		capabilities: sessionInfo.capabilities,
		created_at: Date.now(),
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

/**
 * Signing a pkarr record or a homeserver signup re-homes an identity, so both are ownership
 * actions that belong to the app holding the key. Resolved from Redux alone: a borrowed identity
 * is refused before any key material is fetched.
 */
const isBorrowedPubky = (pubky: string): boolean => {
	const normalizedPubky = normalizePubkyReference(pubky);
	const storedPubkyKey = normalizedPubky ? getStoredPubkyKey(pubky, normalizedPubky) : undefined;
	return getPubkyDataFromStore(storedPubkyKey ?? pubky)?.sourceApp === BITKIT_SOURCE_APP;
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
	// Central ownership gate. The individual call sites keep their own checks as defence in depth,
	// but recovery paths such as a failed sign-in must not reach the signer either.
	if (isBorrowedPubky(pubky)) {
		console.log(`[republish] Refusing for ${pubky}: borrowed identity`);
		return err(i18n.t('pubkyErrors.homeserverManagedBySourceApp'));
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
			return false;
		}
		// Publishing a signed pkarr record is an ownership action, so it belongs to the app that
		// owns the key. Ring only maintains records for the identities it owns.
		const isOwned = data.sourceApp !== BITKIT_SOURCE_APP;
		if (!isOwned) {
			console.log(`[republish] Skipping batch item for ${pubky}: borrowed identity`);
		}
		return isOwned;
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

/**
 * Restores all pubkys from the keychain and signs up to the homeserver.
 * @param {Dispatch} dispatch
 * @returns {Promise<string[]>}
 */
export const restorePubkys = async (dispatch: Dispatch): Promise<string[]> => {
	const allKeys = await getAllKeychainKeys();
	if (allKeys?.length > 0) {
		for (const key of allKeys) {
			const privateIdentity = privatePubkyService(key);
			if (!privateIdentity) continue;
			const { service, pubky } = privateIdentity;
			try {
				const secretKeyRes = await getKeychainValue({ key: service });
				if (secretKeyRes.isOk()) {
					const isMigrated = isNewFormat(secretKeyRes.value);
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
		if (
			getHomeserverRes.isOk() &&
			getHomeserverRes.value &&
			!getHomeserverRes.value.toLowerCase().includes('error') &&
			!getHomeserverRes.value.toLowerCase().includes('no homeserver')
		) {
			homeserver = getHomeserverRes.value;
		}
		signInToHomeserver({ pubky, homeserver, dispatch, secretKey }).then(res => {
			if (res.isErr()) {
				dispatch(setSignedUp({ pubky, signedUp: false }));
			}
		});
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
			// Only set homeserver if we have a valid non-empty value
			if (homeserver?.trim()) {
				dispatch(setHomeserver({ pubky, homeserver }));
			}
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

type SavePubkyParams = {
	secretKey: string;
	pubky: string;
	dispatch: Dispatch;
	mnemonic?: string;
	backupPreference?: EBackupPreference;
	isBackedUp?: boolean;
	signupToken?: string;
};

const getPrivatePubkyServices = async (pubky: string): Promise<string[]> =>
	(await getAllKeychainKeys()).filter(service => privatePubkyService(service)?.pubky === pubky);

const hasPrivatePubky = async (pubky: string): Promise<boolean> =>
	(await getPrivatePubkyServices(pubky)).length > 0;

const normalizePubkyReference = (pubky: string): string | undefined =>
	normalizeSharedPubky(pubky.startsWith('pk:') ? pubky.slice(3) : pubky);

const getStoredPubkyKey = (pubky: string, normalizedPubky: string): string | undefined =>
	[pubky, normalizedPubky, `pubky${normalizedPubky}`, `pk:${normalizedPubky}`].find(key =>
		getPubkyDataFromStore(key),
	);

const getPrivateRecordKey = (storedPubkyKey: string | undefined, normalizedPubky: string): string =>
	storedPubkyKey && privatePubkyService(storedPubkyKey) ? storedPubkyKey : normalizedPubky;

export const savePubky = (params: SavePubkyParams): Promise<Result<string>> =>
	withPubkyIdentityLifecycle(() => savePubkyUnlocked(params));

const savePubkyUnlocked = async ({
	secretKey,
	pubky,
	dispatch,
	mnemonic = '',
	backupPreference = EBackupPreference.unknown,
	isBackedUp = false,
	signupToken = '',
}: SavePubkyParams): Promise<Result<string>> => {
	try {
		const normalizedPubky = normalizePubkyReference(pubky);
		if (!normalizedPubky) {
			return err(i18n.t('pubkyErrors.failedToGetPublicKey'));
		}
		const storedPubkyKey = getStoredPubkyKey(pubky, normalizedPubky);
		const storedPubky = storedPubkyKey ? getPubkyDataFromStore(storedPubkyKey) : undefined;
		if (storedPubky?.sourceApp === BITKIT_SOURCE_APP) {
			return err(i18n.t('pubkyErrors.pubkyAlreadyExists'));
		}
		const derived = await getPublicKeyFromSecretKey(secretKey);
		if (derived.isErr() || normalizeSharedPubky(derived.value.public_key) !== normalizedPubky) {
			return err(i18n.t('pubkyErrors.failedToGetPublicKey'));
		}
		pubky = normalizedPubky;
		// Ensure the mnemonic phrase generates the expected secretKey
		if (mnemonic) {
			const res = await mnemonicPhraseToKeypair(mnemonic);
			if (res.isErr()) {
				return err(res.error.message);
			}
			if (res.value.secret_key !== secretKey) {
				return err(i18n.t('pubkyErrors.mnemonicDoesNotMatchSecretKey'));
			}
			if (normalizeSharedPubky(res.value.public_key) !== pubky) {
				return err(i18n.t('pubkyErrors.mnemonicDoesNotMatchPubky'));
			}
		} else {
			// If no mnemonic is provided we have to default to the encrypted file.
			backupPreference = EBackupPreference.encryptedFile;
		}
		const keychainData: IKeychainData = {
			secretKey,
			mnemonic,
		};
		const serializedKeychainData = JSON.stringify(keychainData);
		const privateRecordKey = getPrivateRecordKey(storedPubkyKey, normalizedPubky);
		const privateRecordExists = (await getAllKeychainKeys()).includes(privateRecordKey);
		const previousPrivateRecord = privateRecordExists
			? await getKeychainValue({ key: privateRecordKey })
			: undefined;
		if (previousPrivateRecord?.isErr()) {
			return err(previousPrivateRecord.error.message);
		}
		const saveResponse = await setKeychainValue({
			key: privateRecordKey,
			value: serializedKeychainData,
		});
		if (saveResponse.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('pubkyErrors.failedToSaveToKeychain'),
				description: saveResponse.error.message,
			});
			return err(saveResponse.error.message);
		}
		const readBack = await getKeychainValue({ key: privateRecordKey });
		if (readBack.isErr() || readBack.value !== serializedKeychainData) {
			if (previousPrivateRecord?.isOk()) {
				await setKeychainValue({ key: privateRecordKey, value: previousPrivateRecord.value });
			} else {
				await resetKeychainValue({ key: privateRecordKey });
			}
			return err(i18n.t('pubkyErrors.failedToSaveToKeychain'));
		}
		if (storedPubkyKey) {
			dispatch(
				setPubkyData({
					pubky: storedPubkyKey,
					data: { backupPreference, isBackedUp, sourceApp: RING_SOURCE_APP },
				}),
			);
		} else {
			dispatch(
				addPubky({
					pubky,
					backupPreference,
					isBackedUp,
					signupToken,
					sourceApp: RING_SOURCE_APP,
				}),
			);
		}
		// Sharing may be unavailable until provisioning is configured. The private record remains
		// canonical and a foreground reconciliation will retry without risking data loss.
		await mirrorSharedPubky(pubky, secretKey);
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

/**
 * Clears every app-private homeserver session secret belonging to an identity.
 * Sessions are keyed by whichever pubky string created them, which may be the stored
 * (possibly prefixed) key or its canonical form, so every known variant is cleared.
 */
const clearPubkySessionSecrets = async (candidates: Array<string | undefined>): Promise<Result<boolean>> => {
	// Every variant is attempted even after a failure, so one bad entry never shields the rest.
	let firstError: Error | undefined;
	for (const candidate of new Set(candidates.filter((value): value is string => !!value))) {
		const res = await resetPubkySessionSecrets({ pubky: candidate });
		if (res.isErr()) firstError = firstError ?? res.error;
	}
	return firstError ? err(firstError) : ok(true);
};

/**
 * Drops a borrowed identity Ring can no longer use. The source app keeps its own key, but the
 * homeserver session secrets Ring created now live in the Keychain rather than in Redux, so
 * removing the Redux entry alone would strand them. Disconnecting still wins over a Keychain
 * failure: an unusable borrowed profile must never stay active, so a failure is reported and the
 * reference is dropped regardless.
 *
 * Serialized like every other identity-lifecycle change, so it cannot interleave with a connect
 * that is still persisting the identity's session secrets. The lifecycle gate is not reentrant,
 * so this must never be called from inside it.
 *
 * Resolves `true` only when this call is the one that removed the identity, so a caller can
 * explain the removal exactly once however many flows raced to detect it.
 */
export const disconnectBorrowedPubky = (pubky: string, dispatch: Dispatch): Promise<boolean> =>
	withPubkyIdentityLifecycle(async () => {
		// Re-checked under the gate: a concurrent flow may have removed the identity, or replaced
		// it with a Ring-owned one that this must not touch.
		if (getPubkyDataFromStore(pubky)?.sourceApp !== BITKIT_SOURCE_APP) return false;
		const res = await clearPubkySessionSecrets([pubky, normalizePubkyReference(pubky)]);
		if (res.isErr()) {
			console.error('Failed to clear session secrets for disconnected identity', res.error.message);
		}
		dispatch(removePubky(pubky));
		return true;
	});

/**
 * Drops the Ring-owned identities whose readable private key record no longer exists, for a wipe
 * that could not delete every record. A `pk:` Redux key resolves to the canonical private service;
 * every other supported Redux key is also its service key. One whose record survived stays, which
 * keeps the list truthful and the wipe retryable. Must run inside the identity lifecycle gate, so
 * reconciliation cannot interleave with it.
 */
export const removeKeylessPubkys = async ({
	ownedPubkys,
	dispatch,
}: {
	ownedPubkys: string[];
	dispatch: Dispatch;
}): Promise<void> => {
	try {
		const remainingServices = new Set(await getAllKeychainKeys());
		for (const pubky of ownedPubkys) {
			const normalizedPubky = normalizePubkyReference(pubky);
			const privateRecordKey = normalizedPubky ? getPrivateRecordKey(pubky, normalizedPubky) : pubky;
			if (!remainingServices.has(privateRecordKey)) dispatch(removePubky(pubky));
		}
	} catch (error) {
		// Without a readable keychain listing nothing can be proven keyless.
		console.error('Failed to list the keychain after a partial wipe', error);
	}
};

export const wipePubkyRingData = (ownedPubkys: string[], dispatch: Dispatch): Promise<boolean> =>
	withPubkyIdentityLifecycle(async () => {
		// Shared-first removal preserves the canonical private source on failure.
		if (!(await clearOwnedSharedPubkys())) return false;
		if (!(await wipeKeychain()) || !(await clearOwnedSharedPubkys())) {
			// Keep only owned cards whose private source survived, whether private deletion or the
			// final shared-store verification failed.
			await removeKeylessPubkys({ ownedPubkys, dispatch });
			return false;
		}
		return true;
	});

export const deletePubky = (pubky: string, dispatch: Dispatch): Promise<Result<string>> =>
	withPubkyIdentityLifecycle(() => deletePubkyUnlocked(pubky, dispatch));

const deletePubkyUnlocked = async (pubky: string, dispatch: Dispatch): Promise<Result<string>> => {
	try {
		const normalizedPubky = normalizePubkyReference(pubky);
		if (!normalizedPubky) return err(i18n.t('pubkyErrors.errorDeletingPubky'));
		const storedPubkyKey = getStoredPubkyKey(pubky, normalizedPubky) ?? normalizedPubky;
		const pubkyData = getPubkyDataFromStore(storedPubkyKey);
		if (pubkyData?.sourceApp === BITKIT_SOURCE_APP) {
			// Disconnecting a borrowed identity never mutates the source app's key, but the
			// homeserver session secrets Ring created for it are Ring-local private state.
			const sessionSecretsRes = await clearPubkySessionSecrets([storedPubkyKey, normalizedPubky, pubky]);
			if (sessionSecretsRes.isErr()) {
				showToast({
					type: 'error',
					title: i18n.t('pubkyErrors.failedToDelete'),
					description: sessionSecretsRes.error.message,
				});
				return err(sessionSecretsRes.error.message);
			}
			dispatch(removePubky(storedPubkyKey));
			return ok(normalizedPubky);
		}

		// Remove the interoperability mirror first. If this cannot be verified, preserve the
		// private canonical record and UI state so a later reconciliation can recover safely.
		if (!(await removeSharedPubky(normalizedPubky))) {
			return err(i18n.t('pubkyErrors.errorDeletingPubky'));
		}
		const privateServices = await getPrivatePubkyServices(normalizedPubky);
		const privateRecordKey = getPrivateRecordKey(storedPubkyKey, normalizedPubky);
		// The record resolved by the read paths goes last, so an abort part-way through never leaves
		// a listed identity whose key is unreadable. A `pk:` Redux key resolves to the canonical
		// service rather than becoming a private service itself.
		const orderedServices = [
			...privateServices.filter(service => service !== privateRecordKey),
			...privateServices.filter(service => service === privateRecordKey),
		];
		for (const service of orderedServices) {
			const response = await resetKeychainValue({ key: service });
			if (response.isErr()) {
				showToast({
					type: 'error',
					title: i18n.t('pubkyErrors.failedToDelete'),
					description: response.error.message,
				});
				return err(response.error.message);
			}
		}
		// Session secrets go once every private record has been deleted, so every earlier abort
		// leaves the identity intact with its sessions still revocable. From here the private key
		// no longer exists: the Redux entry is removed even if this cleanup fails, because a
		// keyless identity must never stay on screen. The failure is reported, not fatal.
		const sessionSecretsRes = await clearPubkySessionSecrets([storedPubkyKey, normalizedPubky, pubky]);
		dispatch(removePubky(storedPubkyKey));
		if (sessionSecretsRes.isErr()) {
			console.error('Failed to clear session secrets for deleted identity', sessionSecretsRes.error.message);
			showToast({
				type: 'error',
				title: i18n.t('pubkyErrors.failedToDelete'),
				description: sessionSecretsRes.error.message,
			});
		}
		return ok(normalizedPubky);
	} catch (error) {
		console.error('Error deleting pubky:', error);
		return err(i18n.t('pubkyErrors.errorDeletingPubky'));
	}
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
		const serialized = JSON.stringify(keychainData);
		const saveRes = await setKeychainValue({
			key: pubky,
			value: serialized,
		});

		if (saveRes.isErr()) {
			return err(`Failed to migrate keychain entry for ${pubky}: ${saveRes.error.message}`);
		}
		const readBack = await getKeychainValue({ key: pubky });
		if (readBack.isErr() || readBack.value !== serialized) {
			// Keep the legacy source recoverable if verification ever fails.
			await setKeychainValue({ key: pubky, value: oldSecretKey });
			return err(`Failed to verify migrated keychain entry for ${pubky}`);
		}

		return ok(keychainData);
	} catch (error) {
		return err(`Error migrating keychain entry: ${error}`);
	}
};

export const getPubkySecretKey = async (pubky: string): Promise<Result<IKeychainData>> => {
	try {
		const pubkyData = getPubkyDataFromStore(pubky);
		if (pubkyData?.sourceApp === BITKIT_SOURCE_APP) {
			const credential = await getSharedPubkyCredential({
				pubky,
				sourceApp: BITKIT_SOURCE_APP,
			});
			if (!credential) {
				// Fail closed, then explain: the identity has just been dropped, so the caller's
				// error message is the only chance to tell the user why it disappeared.
				if (await disconnectBorrowedPubky(pubky, store.dispatch)) {
					removeDisconnectedPubkyDetail(pubky);
				}
				return err(i18n.t('reuseSharedPubky.noLongerShared'));
			}
			return ok({ secretKey: credential.secretKey, mnemonic: '' });
		}
		const normalizedPubky = normalizePubkyReference(pubky);
		const privateRecordKey = normalizedPubky ? getPrivateRecordKey(pubky, normalizedPubky) : pubky;
		const res = await getKeychainValue({ key: privateRecordKey });
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

		return await withPubkyIdentityLifecycle(async () => {
			// Re-read under the lifecycle gate so deletion/wipe cannot resurrect a stale value.
			const current = await getKeychainValue({ key: privateRecordKey });
			if (current.isErr()) return err(i18n.t('pubkyErrors.failedToGetSecretKeyFromKeychain'));
			if (isNewFormat(current.value)) return ok(JSON.parse(current.value));
			return await migrateKeychainEntry(privateRecordKey, current.value);
		});
	} catch {
		return err(i18n.t('pubkyErrors.unableToGetSecretKey'));
	}
};

/**
 * Adds a Bitkit-owned identity without copying its secret into Ring's private keychain or mirror.
 * The credential exists only for this authentication call; Redux persists the source reference
 * and the app-private Pubky session returned by the homeserver.
 */
type ConnectSharedPubkyParams = {
	identity: SharedPubkyIdentity;
	dispatch: Dispatch;
};

export const connectSharedPubky = (params: ConnectSharedPubkyParams): Promise<Result<string>> =>
	withPubkyIdentityLifecycle(() => connectSharedPubkyUnlocked(params));

const connectSharedPubkyUnlocked = async ({
	identity,
	dispatch,
}: ConnectSharedPubkyParams): Promise<Result<string>> => {
	const requestedPubky = normalizeSharedPubky(identity.pubky);
	if (!requestedPubky || getPubkyDataFromStore(requestedPubky) || (await hasPrivatePubky(requestedPubky))) {
		return err(i18n.t('reuseSharedPubky.alreadyConnected'));
	}
	const credential = await getSharedPubkyCredential(identity);
	if (!credential) return err(i18n.t('pubkyErrors.secretKeyNotFoundInKeychain'));

	const pubky = credential.pubky;
	if (getPubkyDataFromStore(pubky)) {
		// Discovery and selection are asynchronous; another flow may have connected this identity.
		return err(i18n.t('reuseSharedPubky.alreadyConnected'));
	}
	let homeserver = defaultPubkyState.homeserver;
	const homeserverResult = await getHomeserver(pubky);
	if (
		homeserverResult.isOk() &&
		homeserverResult.value &&
		!homeserverResult.value.toLowerCase().includes('error') &&
		!homeserverResult.value.toLowerCase().includes('no homeserver')
	) {
		homeserver = homeserverResult.value;
	}

	dispatch(
		addPubky({
			pubky,
			sourceApp: BITKIT_SOURCE_APP,
			backupPreference: EBackupPreference.unknown,
			isBackedUp: false,
		}),
	);
	if (homeserver?.trim()) dispatch(setHomeserver({ pubky, homeserver }));

	const signInResult = await signInToHomeserver({
		pubky,
		// Signing in resolves the homeserver from the key itself, so an identity whose record could
		// not be resolved must not be blocked here. The fallback is only a non-empty placeholder and
		// is deliberately not persisted: the store keeps a genuinely resolved homeserver or nothing.
		// The one path that would publish it, republishHomeserver, is refused for borrowed keys.
		homeserver: homeserver || DEFAULT_HOMESERVER,
		secretKey: credential.secretKey,
		dispatch,
	});
	if (signInResult.isErr()) {
		dispatch(removePubky(pubky));
		return err(signInResult.error.message);
	}

	if (homeserver === PRODUCTION_HOMESERVER || homeserver === STAGING_HOMESERVER) {
		const app = homeserver === STAGING_HOMESERVER ? STAGING_APP_HOST : PRODUCTION_APP_HOST;
		const profileInfo = await getProfileInfo(pubky, app);
		if (profileInfo.isOk() && profileInfo.value.name) {
			dispatch(setPubkyData({ pubky, data: { name: profileInfo.value.name } }));
		}
		const avatar = await getProfileAvatar(pubky, app);
		if (avatar.isOk()) {
			dispatch(setPubkyData({ pubky, data: { image: avatar.value } }));
		}
	}
	return ok(pubky);
};

/** Rebuilds source-owned mirrors exclusively from Ring's validated private keychain records. */
export const reconcileOwnedSharedPubkys = (): Promise<boolean> =>
	withPubkyIdentityLifecycle(reconcileOwnedSharedPubkysUnlocked).catch(() => false);

const reconcileOwnedSharedPubkysUnlocked = async (): Promise<boolean> => {
	const identities = new Map<string, string>();
	const privateServices = await getAllKeychainKeys();
	for (const service of privateServices) {
		const privateIdentity = privatePubkyService(service);
		if (!privateIdentity) continue;
		const { pubky } = privateIdentity;
		const value = await getKeychainValue({ key: service });
		if (value.isErr()) return false;
		// Reconciliation is read-only with respect to the private source. Legacy values are
		// mirrored in memory and upgraded only through the verified migration path when used.
		const data = isNewFormat(value.value)
			? (JSON.parse(value.value) as IKeychainData)
			: { secretKey: value.value, mnemonic: '' };
		if (!isValidSharedSecretKey(data.secretKey)) return false;
		const derived = await getPublicKeyFromSecretKey(data.secretKey);
		if (derived.isErr() || normalizeSharedPubky(derived.value.public_key) !== pubky) return false;
		const existingSecretKey = identities.get(pubky);
		if (existingSecretKey && existingSecretKey !== data.secretKey) {
			// Ambiguous private sources must never cause a destructive shared reconciliation.
			return false;
		}
		identities.set(pubky, data.secretKey);
	}
	return reconcileSharedPubkys(
		[...identities]
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([pubky, secretKey]) => ({ pubky, secretKey })),
	);
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
	// Signing up publishes a homeserver record for the key, so it re-homes the identity. Only the
	// owning app may do that, and the edit flow can reach this with a locally changed homeserver.
	if (isBorrowedPubky(pubky)) {
		return err(i18n.t('pubkyErrors.homeserverManagedBySourceApp'));
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
}: {
	pubky: string;
	homeserver?: string;
	dispatch: Dispatch;
	secretKey?: string;
}): Promise<Result<SessionInfo>> => {
	if (!homeserver) {
		const pubkyData = getPubkyDataFromStore(pubky);
		// A borrowed identity with no resolvable homeserver record is stored with an empty string,
		// which `??` does not catch. Only a borrowed identity gets that fallback: the recovery path
		// below republishes this value, which is refused for borrowed keys but would re-home a
		// Ring-owned identity to the default homeserver. An owned key keeps failing closed.
		homeserver =
			pubkyData?.sourceApp === BITKIT_SOURCE_APP
				? pubkyData.homeserver || DEFAULT_HOMESERVER
				: (pubkyData?.homeserver ?? DEFAULT_HOMESERVER);
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
	const saveSessionRes = await saveHomeserverSession({ pubky, sessionInfo: response, dispatch });
	if (saveSessionRes.isErr()) {
		return err(getErrorMessage(saveSessionRes.error, i18n.t('keychain.failedToSetValue')));
	}
	dispatch(setSignedUp({ pubky, signedUp: true }));
	return ok(response);
};

export const signOutOfHomeserver = async (
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
	dispatch(setSignedUp({ pubky, signedUp: false }));
	dispatch(removeSession({ pubky, sessionId }));
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
		const isOnline = await checkNetworkConnection({
			displayToastIfOnline: false,
			displayToastIfOffline: false,
		});
		if (!isOnline) {
			return err(i18n.t('network.offlineDescription'));
		}
		const authPromise = (async (): Promise<Result<string>> => {
			if (!pubky) {
				return err(i18n.t('pubkyErrors.pubkyRequiredForAuth'));
			}
			// Read before the fetch: a borrowed credential that has gone away auto-disconnects the
			// identity, so afterwards the store no longer knows it was borrowed.
			const wasBorrowed = getPubkyDataFromStore(pubky)?.sourceApp === BITKIT_SOURCE_APP;
			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				// A borrowed identity fails here because its source app stopped sharing it, which is
				// worth explaining; an owned one keeps the generic keychain message.
				return err(wasBorrowed ? secretKeyRes.error.message : i18n.t('pubkyErrors.failedToGetSecretKey'));
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
			// A borrowed identity's homeserver record belongs to the app that owns the key, and the
			// value cached here is only as fresh as the moment it was connected. Authorising a third
			// party must not overwrite the owner's record with it.
			const isBorrowed = pubkyData?.sourceApp === BITKIT_SOURCE_APP;
			if (!republishedDuringSignup && homeserver && !isBorrowed) {
				republishHomeserver({ pubky, secretKey, homeserver, dispatch });
			}
			return ok('success');
		})();

		const timeoutPromise = timeout(TIMEOUT_MS).then((): Result<string> => err(i18n.t('auth.timeoutError')));

		return await Promise.race([authPromise, timeoutPromise]);
	} catch (error: unknown) {
		console.error('Auth Error:', error);
		const errorMessage = error instanceof Error ? error.message : i18n.t('pubkyErrors.authorizationError');
		return err(`Auth Error: ${errorMessage}`);
	}
};
