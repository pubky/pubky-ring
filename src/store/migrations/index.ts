import { PersistedState } from 'redux-persist';
import { signOut } from '@synonymdev/react-native-pubky';
import { EBackupPreference } from '../../types/pubky';
import { getSessionSecret, resetSessionSecret } from '../../utils/keychain';

type PersistedSession = Record<string, unknown>;

const revokeLegacySession = (session: Record<string, unknown>): void => {
	if (typeof session.session_secret !== 'string' || session.session_secret.length === 0) {
		return;
	}

	signOut(session.session_secret)
		.then(result => {
			if (result.isErr()) {
				console.error('Failed to revoke legacy homeserver session', result.error.message);
			}
		})
		.catch(error => {
			console.error('Failed to revoke legacy homeserver session', error);
		});
};

const revokeStoredSession = (pubky: string, session: Record<string, unknown>): void => {
	if (typeof session.id !== 'string' || session.id.length === 0) {
		return;
	}

	const sessionId = session.id;
	getSessionSecret({ pubky, sessionId })
		.then(result => {
			if (result.isErr()) {
				return;
			}

			return signOut(result.value).then(signOutResult => {
				if (signOutResult.isErr()) {
					console.error('Failed to revoke stored homeserver session', signOutResult.error.message);
				}
			});
		})
		.catch(error => {
			console.error('Failed to revoke stored homeserver session', error);
		})
		.finally(() => {
			resetSessionSecret({ pubky, sessionId }).catch(error => {
				console.error('Failed to reset stored homeserver session', error);
			});
		});
};

const migrations = {
	// @ts-ignore
	1: (state): PersistedState => {
		return {
			...state,
			pubky: {
				...state.pubky,
				deepLink: '',
			},
		};
	},
	// @ts-ignore
	2: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				signedTermsOfUse: false,
			},
		};
	},
	// @ts-ignore
	3: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		// Add backupPreference to all existing pubkys
		Object.keys(updatedPubkys).forEach(pubkyKey => {
			if (!updatedPubkys[pubkyKey].backupPreference) {
				updatedPubkys[pubkyKey] = {
					...updatedPubkys[pubkyKey],
					backupPreference: EBackupPreference.encryptedFile,
				};
			}
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
	// @ts-ignore
	4: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		// Add isBackedUp to all existing pubkys
		Object.keys(updatedPubkys).forEach(pubkyKey => {
			updatedPubkys[pubkyKey] = {
				...updatedPubkys[pubkyKey],
				isBackedUp: false,
			};
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
	// @ts-ignore
	5: (state): PersistedState => {
		return {
			...state,
			pubky: {
				...state.pubky,
				processing: {},
			},
		};
	},
	// @ts-ignore
	6: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		// Add session_secret to all existing sessions
		Object.keys(updatedPubkys).forEach(pubkyKey => {
			const pubky = updatedPubkys[pubkyKey];
			if (pubky.sessions && pubky.sessions.length > 0) {
				updatedPubkys[pubkyKey] = {
					...pubky,
					sessions: pubky.sessions.map((session: PersistedSession) => ({
						...session,
						session_secret: '',
					})),
				};
			}
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
	// @ts-ignore
	7: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		Object.keys(updatedPubkys).forEach(pubkyKey => {
			const pubky = updatedPubkys[pubkyKey];
			updatedPubkys[pubkyKey] = {
				...pubky,
				sessions: (pubky.sessions ?? [])
					// Legacy persisted sessions had bearer session_secret values but no local id.
					// Revoke them before dropping the local copy.
					.filter(
						(session: Record<string, unknown>) => {
							if (typeof session.id !== 'string' || session.id.length === 0) {
								revokeLegacySession(session);
								return false;
							}

							return true;
						},
					)
					// Persist only the non-secret metadata needed by the session list/details UI.
					.map((session: Record<string, unknown>) => ({
						id: session.id,
						capabilities: session.capabilities,
						created_at: session.created_at,
					})),
			};
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
	// @ts-ignore
	8: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		// Grant auth replaces legacy Cookie auth sessions. Keep identities, but
		// drop existing sessions so apps request fresh grant sessions.
		Object.keys(updatedPubkys).forEach(pubkyKey => {
			const pubky = updatedPubkys[pubkyKey];
			(pubky.sessions ?? []).forEach((session: Record<string, unknown>) => {
				revokeStoredSession(pubkyKey, session);
			});
			updatedPubkys[pubkyKey] = {
				...pubky,
				sessions: [],
			};
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
};

export default migrations;
