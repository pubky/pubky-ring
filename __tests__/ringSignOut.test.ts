import { err, ok } from '@synonymdev/result';
import * as NativePubky from '@synonymdev/react-native-pubky';
import { configureStore } from '@reduxjs/toolkit';
import {
	importPubky,
	listAuthorizedGrants,
	signInToHomeserver,
	signOutRingFromHomeserver,
	signUpToHomeserver,
} from '../src/utils/pubky';
import { refreshAuthorizedGrants } from '../src/utils/authorizedGrants';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';
import {
	getSessionSecret,
	resetSessionSecret,
	resetPubkySessionSecrets,
	setSessionSecret,
} from '../src/utils/keychain';
import { defaultPubkyState, initialState } from '../src/store/shapes/pubky';
import { PRODUCTION_HOMESERVER, STAGING_HOMESERVER } from '../src/utils/constants';
import { HomeserverChangedError } from '../src/utils/homeserverChangedError';
import { sanitizePubkySessions } from '../src/store/transforms/pubkyPersistence';
import type { Pubky } from '../src/types/pubky';
import type { Dispatch } from 'redux';

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('@synonymdev/react-native-pubky', () => ({
	signIn: jest.fn(),
	signOut: jest.fn(),
	listGrants: jest.fn(),
	revalidateSession: jest.fn(),
	revokeGrant: jest.fn(),
	republishHomeserver: jest.fn(),
	publish: jest.fn(),
	signUp: jest.fn(),
	getPublicKeyFromSecretKey: jest.fn(),
	getHomeserver: jest.fn(),
}));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));
jest.mock('uuid', () => ({
	v5: (secret: string) => (secret === 'temporary-secret' ? 'temporary-session' : `session-${secret}`),
}));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../src/utils/helpers', () => ({ checkNetworkConnection: jest.fn() }));
jest.mock('../src/utils/store-helpers', () => ({ getPubkyDataFromStore: jest.fn() }));
jest.mock('../src/utils/sharedPubky', () => ({ publishOwnedPubky: jest.fn() }));
jest.mock('../src/utils/keychain', () => ({
	getKeychainValue: jest.fn(async () => {
		const { ok: resultOk } = require('@synonymdev/result');
		return resultOk(JSON.stringify({ secretKey: 'identity-secret', mnemonic: '' }));
	}),
	setSessionSecret: jest.fn(),
	getSessionSecret: jest.fn(),
	resetSessionSecret: jest.fn(async () => {
		const { ok: resultOk } = require('@synonymdev/result');
		return resultOk(true);
	}),
	setKeychainValue: jest.fn(async () => {
		const { ok: resultOk } = require('@synonymdev/result');
		return resultOk('stored');
	}),
	resetPubkySessionSecrets: jest.fn(),
}));
jest.mock('../src/store/slices/pubkysSlice', () => ({
	addSession: (payload: unknown) => ({ type: 'pubky/addSession', payload }),
	removeSession: (payload: unknown) => ({ type: 'pubky/removeSession', payload }),
	setPubkyData: (payload: unknown) => ({ type: 'pubky/setPubkyData', payload }),
	setSignedUp: (payload: unknown) => ({ type: 'pubky/setSignedUp', payload }),
	addPubky: (payload: unknown) => ({ type: 'pubky/addPubky', payload }),
	setHomeserver: (payload: unknown) => ({ type: 'pubky/setHomeserver', payload }),
}));
const native = NativePubky as unknown as Record<string, jest.Mock>;
const data = getPubkyDataFromStore as jest.Mock;
const clearSecrets = resetPubkySessionSecrets as jest.Mock;
const saveSecret = setSessionSecret as jest.Mock;
const resetSecret = resetSessionSecret as jest.Mock;
const temporary = {
	homeserver: PRODUCTION_HOMESERVER,
	pubky: 'user',
	grant_id: 'temporary',
	grant_secret: 'temporary-secret',
	capabilities: ['/:rw'],
};
const sessions = ['ring-one', 'ring-two'].map(id => ({
	id,
	grant_id: id,
	capabilities: ['/:rw'],
	created_at: 1,
}));
const args = (dispatch: Dispatch = jest.fn()) => ({
	pubky: 'user',
	homeserver: PRODUCTION_HOMESERVER,
	dispatch,
});

beforeEach(() => {
	jest.clearAllMocks();
	for (const mock of Object.values(native)) {
		if (jest.isMockFunction(mock)) mock.mockReset();
	}
	(getSessionSecret as jest.Mock).mockReset();
	data.mockReturnValue({ ...defaultPubkyState, homeserver: PRODUCTION_HOMESERVER, signedUp: true, sessions });
	native.signIn.mockResolvedValue(ok(temporary));
	native.signOut.mockResolvedValue(ok('signed out'));
	native.listGrants.mockResolvedValue(
		ok(
			['ring-one', 'ring-two', 'temporary', 'another-app', 'another-ring-device'].map(grant_id => ({
				grant_id,
			})),
		),
	);
	native.revokeGrant.mockResolvedValue(ok('revoked'));
	native.republishHomeserver.mockResolvedValue(ok('published'));
	saveSecret.mockResolvedValue(ok('stored'));
	resetSecret.mockResolvedValue(ok(true));
	(getSessionSecret as jest.Mock).mockResolvedValue(ok('stored-secret'));
	clearSecrets.mockResolvedValue(ok(true));
});

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(finish => {
		resolve = finish;
	});
	return { promise, resolve };
};
const createStore = (overrides: Partial<Pubky> = {}) => {
	const reducer = jest.requireActual('../src/store/slices/pubkysSlice').default;
	const store = configureStore({
		reducer,
		preloadedState: {
			...initialState,
			pubkys: {
				user: {
					...defaultPubkyState,
					homeserver: PRODUCTION_HOMESERVER,
					signedUp: true,
					sessions: [],
					...overrides,
				},
				other: { ...defaultPubkyState, homeserver: PRODUCTION_HOMESERVER, signedUp: true, sessions: [] },
			},
		},
	});
	data.mockImplementation((pubky: string) => (store.getState() as typeof initialState).pubkys[pubky]);
	return store;
};

describe('refresh and sign-out ordering', () => {
	it.each(['sign-in', 'keychain'])(
		'does not overwrite a completed homeserver switch when refresh is held at %s',
		async phase => {
			const store = createStore();
			const entered = deferred<void>();
			const release = deferred<void>();
			native.signIn.mockImplementationOnce(async () => {
				if (phase === 'sign-in') {
					entered.resolve();
					await release.promise;
				}
				return ok(temporary);
			});
			saveSecret.mockImplementationOnce(async () => {
				if (phase === 'keychain') {
					entered.resolve();
					await release.promise;
				}
				return ok('stored');
			});
			const switched = {
				...temporary,
				homeserver: STAGING_HOMESERVER,
				grant_id: 'switch-grant',
				grant_secret: 'switch-secret',
			};
			native.signUp.mockResolvedValueOnce(ok(switched));
			(getSessionSecret as jest.Mock).mockResolvedValue(ok('switch-secret'));
			native.listGrants.mockResolvedValue(
				ok([{ grant_id: 'switch-grant' }, { grant_id: 'app-on-new-server' }]),
			);

			const refresh = listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch });
			await entered.promise;
			expect(
				(await signUpToHomeserver({ ...args(store.dispatch), homeserver: STAGING_HOMESERVER })).isOk(),
			).toBe(true);
			expect(store.getState().pubkys.user.homeserver).toBe(STAGING_HOMESERVER);
			release.resolve();
			const stale = await refresh;
			expect(store.getState().pubkys.user.homeserver).toBe(STAGING_HOMESERVER);
			expect(stale.isErr()).toBe(true);
			expect(store.getState().pubkys.user.sessions).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ grant_id: 'temporary', homeserver: PRODUCTION_HOMESERVER }),
					expect.objectContaining({ grant_id: 'switch-grant', homeserver: STAGING_HOMESERVER }),
				]),
			);
			const next = await listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch });
			expect(next.isOk()).toBe(true);
			if (next.isOk()) expect(next.value.grants).toEqual([{ grant_id: 'app-on-new-server' }]);
			expect(native.signIn).toHaveBeenCalledTimes(1);
			expect(native.listGrants.mock.calls).toEqual([['switch-secret']]);
			expect(native.republishHomeserver.mock.calls).toEqual([['identity-secret', STAGING_HOMESERVER]]);
		},
	);

	it.each(['invalid', 'cleanup-only', 'absent'])(
		'reuses the mapped-server session across refreshes when the old session is %s',
		async state => {
			const previous = {
				...sessions[0],
				homeserver: PRODUCTION_HOMESERVER,
				...(state === 'cleanup-only' ? { cleanupOnly: true } : {}),
			};
			const store = createStore({ sessions: state === 'absent' ? [] : [previous] });
			native.signIn.mockResolvedValue(ok({ ...temporary, homeserver: STAGING_HOMESERVER }));
			native.revalidateSession.mockResolvedValue(err('Session is no longer valid'));
			(getSessionSecret as jest.Mock).mockImplementation(async ({ sessionId }) =>
				ok(sessionId === 'temporary-session' ? 'temporary-secret' : 'old-secret'),
			);
			native.listGrants.mockImplementation(async (token: string) =>
				token === 'old-secret'
					? err('Session is no longer valid')
					: ok([{ grant_id: 'temporary' }, { grant_id: 'another-app' }]),
			);

			for (let i = 0; i < 5; i++) {
				const result = await listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch });
				expect(result.isOk()).toBe(true);
				if (result.isOk()) expect(result.value.grants).toEqual([{ grant_id: 'another-app' }]);
			}
			expect(native.signIn).toHaveBeenCalledTimes(1);
			expect(saveSecret).toHaveBeenCalledTimes(1);
			expect(store.getState().pubkys.user).toEqual(
				expect.objectContaining({
					homeserver: STAGING_HOMESERVER,
					lastKnownHomeserver: STAGING_HOMESERVER,
					signedUp: true,
				}),
			);
			expect(store.getState().pubkys.user.sessions).toHaveLength(state === 'cleanup-only' ? 2 : 1);
			if (state === 'cleanup-only') expect(store.getState().pubkys.user.sessions).toContainEqual(previous);
			expect(native.publish).not.toHaveBeenCalled();
			expect(native.republishHomeserver).not.toHaveBeenCalled();
		},
	);
	it('remembers the mapped server even when the first grant list fails', async () => {
		const store = createStore();
		native.signIn.mockResolvedValue(ok({ ...temporary, homeserver: STAGING_HOMESERVER }));
		native.listGrants.mockResolvedValueOnce(err('Offline')).mockResolvedValue(ok([]));

		expect((await listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch })).isErr()).toBe(true);
		expect((await listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch })).isOk()).toBe(true);
		expect(native.signIn).toHaveBeenCalledTimes(1);
		expect(saveSecret).toHaveBeenCalledTimes(1);
		expect(store.getState().pubkys.user.homeserver).toBe(STAGING_HOMESERVER);
	});

	it.each(['sign-in', 'keychain'])(
		'waits for a refresh held at %s, revokes its grant, and rejects queued refreshes',
		async phase => {
			const store = createStore();
			const entered = deferred<void>();
			const release = deferred<void>();
			native.signIn.mockImplementationOnce(async () => {
				if (phase === 'sign-in') {
					entered.resolve();
					await release.promise;
				}
				return ok({ ...temporary, grant_id: 'refresh', grant_secret: 'refresh-secret' });
			});
			saveSecret.mockImplementationOnce(async () => {
				if (phase === 'keychain') {
					entered.resolve();
					await release.promise;
				}
				return ok('stored');
			});
			native.listGrants.mockResolvedValue(
				ok(['refresh', 'temporary', 'another-app'].map(grant_id => ({ grant_id }))),
			);
			const refresh = refreshAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch });
			await entered.promise;
			const queued = refreshAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch, forceReload: true });
			const logout = signOutRingFromHomeserver(args(store.dispatch));
			await new Promise(resolve => setImmediate(resolve));
			const signInsBeforeRelease = native.signIn.mock.calls.length;
			release.resolve();
			const [, queuedResult, logoutResult] = await Promise.all([refresh, queued, logout]);
			expect(signInsBeforeRelease).toBe(1);
			expect(logoutResult.isOk()).toBe(true);
			expect(queuedResult.isErr()).toBe(true);
			expect(native.revokeGrant.mock.calls).toEqual([
				['temporary-secret', 'refresh'],
				['temporary-secret', 'temporary'],
			]);
			expect(store.getState().pubkys.user).toEqual(
				expect.objectContaining({ signedUp: false, sessions: [] }),
			);
			expect((await refreshAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch })).isErr()).toBe(true);
			expect(native.signIn).toHaveBeenCalledTimes(2);
			expect((await signInToHomeserver({ ...args(store.dispatch), allowRepublish: false })).isOk()).toBe(
				true,
			);
			expect(store.getState().pubkys.user.signedUp).toBe(true);
		},
	);
	it('does not block refreshes for another pubky while sign-out waits', async () => {
		const store = createStore();
		const entered = deferred<void>();
		const release = deferred<void>();
		native.signIn
			.mockImplementationOnce(async () => {
				entered.resolve();
				await release.promise;
				return ok({ ...temporary, grant_id: 'refresh', grant_secret: 'refresh-secret' });
			})
			.mockResolvedValueOnce(
				ok({ ...temporary, pubky: 'other', grant_id: 'other-root', grant_secret: 'other-secret' }),
			);
		const refresh = listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch });
		await entered.promise;
		const logout = signOutRingFromHomeserver(args(store.dispatch));
		let otherFinished = false;
		const other = listAuthorizedGrants({ pubky: 'other', dispatch: store.dispatch }).then(result => {
			otherFinished = true;
			return result;
		});
		await new Promise(resolve => setImmediate(resolve));
		const otherFinishedBeforeRelease = otherFinished;
		release.resolve();
		const [, , result] = await Promise.all([refresh, logout, other]);
		expect(otherFinishedBeforeRelease).toBe(true);
		expect(result.isOk()).toBe(true);
		expect(store.getState().pubkys.other.signedUp).toBe(true);
	});
	it('allows refresh again after sign-out fails', async () => {
		const store = createStore();
		native.signIn.mockResolvedValueOnce(err('Offline'));
		expect((await signOutRingFromHomeserver(args(store.dispatch))).isErr()).toBe(true);
		expect((await listAuthorizedGrants({ pubky: 'user', dispatch: store.dispatch })).isOk()).toBe(true);
		expect(store.getState().pubkys.user.signedUp).toBe(true);
	});
});

describe('failed cleanup of an unexpected server grant', () => {
	it('finishes current-server revocation even when multiple older records cannot be cleaned up', async () => {
		const pending = ['missing', 'expired-token', 'offline'].map(id => ({
			id,
			grant_id: id,
			homeserver: STAGING_HOMESERVER,
			capabilities: ['/:rw'],
			created_at: 1,
		}));
		const store = createStore({ sessions: pending });
		(getSessionSecret as jest.Mock).mockImplementation(async ({ sessionId }) =>
			sessionId === 'missing' ? err('Keychain unavailable') : ok(sessionId),
		);
		native.signOut.mockImplementation(async (token: string) =>
			err(token === 'offline' ? 'Server unavailable' : 'Session token expired or invalidated'),
		);
		const result = await signOutRingFromHomeserver(args(store.dispatch));
		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.cleanupPending).toBe(true);
		expect(store.getState().pubkys.user).toEqual(
			expect.objectContaining({
				signedUp: false,
				sessions: pending.map(session => ({ ...session, cleanupOnly: true })),
			}),
		);
		expect(native.revokeGrant.mock.calls).toEqual([['temporary-secret', 'temporary']]);
		expect(clearSecrets).toHaveBeenCalledWith({
			pubky: 'user',
			keepSessionIds: pending.map(session => session.id),
		});
	});
	it.each(['error result', 'exception'])(
		'retains cleanup credentials after an %s and revokes the grant on later sign-out',
		async failure => {
			const store = createStore({ signedUp: false });
			native.signIn.mockResolvedValueOnce(
				ok({
					...temporary,
					homeserver: STAGING_HOMESERVER,
					grant_id: 'unexpected',
					grant_secret: 'unexpected-secret',
				}),
			);
			if (failure === 'exception') native.signOut.mockRejectedValueOnce(new Error('Offline'));
			else native.signOut.mockResolvedValueOnce(err('Offline'));
			const result = await signInToHomeserver({ ...args(store.dispatch), allowRepublish: false });
			expect(result.isErr()).toBe(true);
			expect(store.getState().pubkys.user.signedUp).toBe(false);
			const persisted = JSON.parse(JSON.stringify(sanitizePubkySessions(store.getState())));
			expect(persisted.pubkys.user.sessions).toEqual([
				expect.objectContaining({
					grant_id: 'unexpected',
					cleanupOnly: true,
					homeserver: STAGING_HOMESERVER,
				}),
			]);
			expect(JSON.stringify(persisted)).not.toContain('grant_secret');
			expect(saveSecret).toHaveBeenCalledWith({
				pubky: 'user',
				sessionId: 'session-unexpected-secret',
				sessionSecret: 'unexpected-secret',
			});
			store.dispatch({
				type: 'pubky/setPubkyData',
				payload: {
					pubky: 'user',
					data: { homeserver: STAGING_HOMESERVER, signedUp: true, sessions: persisted.pubkys.user.sessions },
				},
			});
			native.signIn.mockResolvedValueOnce(ok({ ...temporary, homeserver: STAGING_HOMESERVER }));
			native.listGrants.mockResolvedValueOnce(
				ok([{ grant_id: 'unexpected' }, { grant_id: 'temporary' }, { grant_id: 'another-app' }]),
			);
			expect(
				(await signOutRingFromHomeserver({ ...args(store.dispatch), homeserver: STAGING_HOMESERVER })).isOk(),
			).toBe(true);
			expect(native.revokeGrant.mock.calls).toEqual([
				['temporary-secret', 'unexpected'],
				['temporary-secret', 'temporary'],
			]);
			expect(store.getState().pubkys.user).toEqual(
				expect.objectContaining({ signedUp: false, sessions: [] }),
			);
		},
	);
	it('does not erase another server’s pending cleanup credentials when that cleanup fails', async () => {
		const pending = {
			id: 'pending',
			grant_id: 'unexpected',
			capabilities: ['/:rw'],
			created_at: 1,
			cleanupOnly: true,
			homeserver: STAGING_HOMESERVER,
		};
		const store = createStore({ sessions: [pending] });
		(getSessionSecret as jest.Mock).mockResolvedValue(ok('unexpected-secret'));
		native.signOut.mockResolvedValueOnce(err('Offline'));
		const result = await signOutRingFromHomeserver(args(store.dispatch));
		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.cleanupPending).toBe(true);
		expect(clearSecrets).toHaveBeenCalledWith({ pubky: 'user', keepSessionIds: ['pending'] });
		expect(store.getState().pubkys.user.sessions).toContainEqual(pending);
		expect(store.getState().pubkys.user.signedUp).toBe(false);
		const retry = await signOutRingFromHomeserver(args(store.dispatch));
		expect(retry.isOk()).toBe(true);
		if (retry.isOk()) expect(retry.value.cleanupPending).toBe(false);
		expect(native.signOut).toHaveBeenLastCalledWith('unexpected-secret');
	});
	it.each(['stored grant credential has expired', 'delegated grant credential has expired'])(
		'discards a confirmed expired grant (%s) without blocking current-server sign-out',
		async reason => {
			const old = {
				id: 'expired',
				grant_id: 'expired-A',
				homeserver: STAGING_HOMESERVER,
				capabilities: ['/:rw'],
				created_at: 1,
			};
			const store = createStore({ sessions: [old] });
			native.signOut.mockResolvedValueOnce(err(`Failed to import session: ${reason}`));
			const result = await signOutRingFromHomeserver(args(store.dispatch));
			expect(result.isOk()).toBe(true);
			if (result.isOk()) expect(result.value.cleanupPending).toBe(false);
			expect(store.getState().pubkys.user.sessions).toEqual([]);
			expect(resetSecret).toHaveBeenCalledWith({ pubky: 'user', sessionId: 'expired' });
		},
	);
	it('retains an ambiguous token-expiry error as cleanup-only while finishing current-server sign-out', async () => {
		const old = { id: 'uncertain', grant_id: 'grant-A', capabilities: ['/:rw'], created_at: 1 };
		const store = createStore({ sessions: [old] });
		native.signOut.mockResolvedValueOnce(err('Failed to import session: token expired or revoked'));
		const result = await signOutRingFromHomeserver(args(store.dispatch));
		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.cleanupPending).toBe(true);
		expect(store.getState().pubkys.user.sessions).toEqual([{ ...old, cleanupOnly: true }]);
		expect(clearSecrets).toHaveBeenCalledWith({ pubky: 'user', keepSessionIds: ['uncertain'] });
		expect(resetSecret).not.toHaveBeenCalledWith({ pubky: 'user', sessionId: 'uncertain' });
	});
});

describe('sign-out after switching homeservers', () => {
	it('does not retry an already revoked legacy token after a partial current-server failure', async () => {
		const store = createStore({ sessions });
		native.listGrants
			.mockResolvedValueOnce(
				ok([{ grant_id: 'ring-one' }, { grant_id: 'ring-two' }, { grant_id: 'temporary' }]),
			)
			.mockResolvedValueOnce(ok([{ grant_id: 'ring-two' }, { grant_id: 'temporary' }]));
		native.revokeGrant.mockResolvedValueOnce(ok('revoked')).mockResolvedValueOnce(err('Offline'));
		native.signOut.mockResolvedValue(err('Token expired or revoked'));
		expect((await signOutRingFromHomeserver(args(store.dispatch))).isErr()).toBe(true);
		expect(store.getState().pubkys.user.sessions).not.toEqual(
			expect.arrayContaining([expect.objectContaining({ grant_id: 'ring-one' })]),
		);
		expect((await signOutRingFromHomeserver(args(store.dispatch))).isOk()).toBe(true);
		expect(native.signOut).not.toHaveBeenCalled();
	});
	it('records both signup servers and revokes A and B grants before clearing their credentials', async () => {
		const store = createStore({ signedUp: false });
		const keychain = new Map<string, string>();
		const grants = new Map([
			[PRODUCTION_HOMESERVER, new Set(['another-app-A'])],
			[STAGING_HOMESERVER, new Set(['another-app-B'])],
		]);
		const tokens = new Map<string, { homeserver: string; grant_id: string }>();
		const issue = (homeserver: string, grant_id: string) => {
			const session = { ...temporary, homeserver, grant_id, grant_secret: `${grant_id}-secret` };
			grants.get(homeserver)!.add(grant_id);
			tokens.set(session.grant_secret, { homeserver, grant_id });
			return ok(session);
		};
		native.signUp.mockImplementation(async (_secret: string, homeserver: string) =>
			issue(homeserver, homeserver === PRODUCTION_HOMESERVER ? 'ring-A' : 'ring-B'),
		);
		native.signIn.mockImplementation(async () => issue(STAGING_HOMESERVER, 'management-B'));
		saveSecret.mockImplementation(async ({ sessionId, sessionSecret }) => {
			keychain.set(sessionId, sessionSecret);
			return ok('stored');
		});
		(getSessionSecret as jest.Mock).mockImplementation(async ({ sessionId }) =>
			keychain.has(sessionId) ? ok(keychain.get(sessionId)!) : err('Missing secret'),
		);
		resetSecret.mockImplementation(async ({ sessionId }) => {
			keychain.delete(sessionId);
			return ok(true);
		});
		clearSecrets.mockImplementation(async () => {
			keychain.clear();
			return ok(true);
		});
		native.listGrants.mockImplementation(async (token: string) =>
			ok([...grants.get(tokens.get(token)!.homeserver)!].map(grant_id => ({ grant_id }))),
		);
		native.revokeGrant.mockImplementation(async (token: string, id: string) => {
			grants.get(tokens.get(token)!.homeserver)!.delete(id);
			return ok('revoked');
		});
		native.signOut.mockImplementation(async (token: string) => {
			const session = tokens.get(token)!;
			grants.get(session.homeserver)!.delete(session.grant_id);
			return ok('revoked');
		});
		for (const homeserver of [PRODUCTION_HOMESERVER, STAGING_HOMESERVER]) {
			expect(
				(
					await signUpToHomeserver({
						pubky: 'user',
						homeserver,
						secretKey: 'identity-secret',
						dispatch: store.dispatch,
					})
				).isOk(),
			).toBe(true);
		}
		const persisted = JSON.parse(JSON.stringify(sanitizePubkySessions(store.getState())));
		store.dispatch({ type: 'pubky/setPubkyData', payload: { pubky: 'user', data: persisted.pubkys.user } });
		expect(
			(await signOutRingFromHomeserver({ ...args(store.dispatch), homeserver: STAGING_HOMESERVER })).isOk(),
		).toBe(true);
		expect(grants.get(PRODUCTION_HOMESERVER)).toEqual(new Set(['another-app-A']));
		expect(grants.get(STAGING_HOMESERVER)).toEqual(new Set(['another-app-B']));
		expect(keychain.size).toBe(0);
		expect(store.getState().pubkys.user).toEqual(expect.objectContaining({ signedUp: false, sessions: [] }));
		expect(persisted.pubkys.user.sessions).toEqual([
			expect.objectContaining({ grant_id: 'ring-A', homeserver: PRODUCTION_HOMESERVER }),
			expect.objectContaining({ grant_id: 'ring-B', homeserver: STAGING_HOMESERVER }),
		]);
	});
	it.each([PRODUCTION_HOMESERVER, undefined])(
		'retains an ordinary A grant when cleanup fails (recorded server=%s)',
		async homeserver => {
			const old = { id: 'old-A', grant_id: 'ring-A', capabilities: ['/:rw'], created_at: 1, homeserver };
			const store = createStore({ homeserver: STAGING_HOMESERVER, sessions: [old] });
			native.signIn.mockResolvedValue(ok({ ...temporary, homeserver: STAGING_HOMESERVER }));
			native.listGrants.mockResolvedValue(ok([{ grant_id: 'temporary' }, { grant_id: 'another-app-B' }]));
			native.signOut.mockResolvedValueOnce(err('Offline'));
			const result = await signOutRingFromHomeserver({
				...args(store.dispatch),
				homeserver: STAGING_HOMESERVER,
			});
			expect(result.isOk()).toBe(true);
			if (result.isOk()) expect(result.value.cleanupPending).toBe(true);
			expect(clearSecrets).toHaveBeenCalledWith({ pubky: 'user', keepSessionIds: ['old-A'] });
			expect(resetSecret).not.toHaveBeenCalledWith({ pubky: 'user', sessionId: 'old-A' });
			expect(store.getState().pubkys.user.sessions).toContainEqual({ ...old, cleanupOnly: true });
			expect(store.getState().pubkys.user.signedUp).toBe(false);
		},
	);
	it('revokes a legacy unknown-server session with its own token when B does not list its grant', async () => {
		const store = createStore({
			sessions: [{ id: 'legacy', grant_id: 'legacy-A', capabilities: ['/:rw'], created_at: 1 }],
		});
		native.listGrants.mockResolvedValueOnce(ok([{ grant_id: 'temporary' }]));
		(getSessionSecret as jest.Mock).mockResolvedValueOnce(ok('legacy-A-secret'));
		expect((await signOutRingFromHomeserver(args(store.dispatch))).isOk()).toBe(true);
		expect(native.signOut).toHaveBeenCalledWith('legacy-A-secret');
		expect(resetSecret).toHaveBeenCalledWith({ pubky: 'user', sessionId: 'legacy' });
	});
	it('retains an unknown-server record if its secret cannot be read', async () => {
		const old = { id: 'legacy', grant_id: 'legacy-A', capabilities: ['/:rw'], created_at: 1 };
		const store = createStore({ sessions: [old] });
		native.listGrants.mockResolvedValueOnce(ok([{ grant_id: 'temporary' }]));
		(getSessionSecret as jest.Mock).mockResolvedValueOnce(err('Keychain unavailable'));
		const result = await signOutRingFromHomeserver(args(store.dispatch));
		expect(result.isOk()).toBe(true);
		if (result.isOk()) expect(result.value.cleanupPending).toBe(true);
		expect(clearSecrets).toHaveBeenCalledWith({ pubky: 'user', keepSessionIds: ['legacy'] });
		expect(store.getState().pubkys.user.sessions).toContainEqual({ ...old, cleanupOnly: true });
	});
	it('does not retry a revoked A token when a later B request fails', async () => {
		const old = {
			id: 'old-A',
			grant_id: 'ring-A',
			capabilities: ['/:rw'],
			created_at: 1,
			homeserver: STAGING_HOMESERVER,
		};
		const store = createStore({ sessions: [old] });
		native.listGrants.mockResolvedValue(ok([{ grant_id: 'temporary' }]));
		native.revokeGrant.mockResolvedValueOnce(err('Offline'));
		expect((await signOutRingFromHomeserver(args(store.dispatch))).isErr()).toBe(true);
		expect(store.getState().pubkys.user.sessions).not.toContainEqual(old);
		expect(clearSecrets).not.toHaveBeenCalled();
		expect((await signOutRingFromHomeserver(args(store.dispatch))).isOk()).toBe(true);
		expect(native.signOut).toHaveBeenCalledTimes(1);
	});
});

it('revokes only recorded Ring grants and its temporary grant, including expired local session tokens', async () => {
	(getSessionSecret as jest.Mock).mockResolvedValue(err('Expired token'));
	const dispatch = jest.fn();
	const result = await signOutRingFromHomeserver(args(dispatch));
	expect(result.isOk()).toBe(true);
	expect(native.revokeGrant.mock.calls).toEqual([
		['temporary-secret', 'ring-one'],
		['temporary-secret', 'ring-two'],
		['temporary-secret', 'temporary'],
	]);
	expect(clearSecrets).toHaveBeenCalledWith({ pubky: 'user' });
	expect(dispatch).toHaveBeenLastCalledWith({
		type: 'pubky/setPubkyData',
		payload: { pubky: 'user', data: expect.objectContaining({ signedUp: false, sessions: [] }) },
	});
	expect(native.republishHomeserver).not.toHaveBeenCalled();
	expect(native.publish).not.toHaveBeenCalled();
	expect(native.signUp).not.toHaveBeenCalled();
	expect(getSessionSecret).not.toHaveBeenCalled();
});
it('tracks the temporary root grant and preserves local setup on a remote failure', async () => {
	native.revokeGrant.mockResolvedValueOnce(err('Offline'));
	const dispatch = jest.fn();
	const result = await signOutRingFromHomeserver(args(dispatch));
	expect(result.isErr()).toBe(true);
	expect(saveSecret).toHaveBeenCalledWith({
		pubky: 'user',
		sessionId: 'temporary-session',
		sessionSecret: 'temporary-secret',
	});
	expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/addSession' }));
	expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/setPubkyData' }));
	expect(clearSecrets).not.toHaveBeenCalled();
});
it('can retry after partial revocation without treating already revoked grants as failures', async () => {
	native.revokeGrant.mockResolvedValueOnce(ok('revoked')).mockResolvedValueOnce(err('Offline'));
	expect((await signOutRingFromHomeserver(args())).isErr()).toBe(true);
	native.listGrants.mockResolvedValueOnce(
		ok([{ grant_id: 'ring-two' }, { grant_id: 'temporary' }, { grant_id: 'another-app' }]),
	);
	native.revokeGrant.mockClear();
	expect((await signOutRingFromHomeserver(args())).isOk()).toBe(true);
	expect(native.revokeGrant.mock.calls).toEqual([
		['temporary-secret', 'ring-two'],
		['temporary-secret', 'temporary'],
	]);
});
it('does not clear local setup if credential cleanup fails', async () => {
	clearSecrets.mockResolvedValueOnce(err('Keychain unavailable'));
	const dispatch = jest.fn();
	expect((await signOutRingFromHomeserver(args(dispatch))).isErr()).toBe(true);
	expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/setPubkyData' }));
});
it('does not republish a mapping or revoke grants if sign-in fails', async () => {
	native.signIn.mockResolvedValueOnce(err('Offline'));
	expect((await signOutRingFromHomeserver(args())).isErr()).toBe(true);
	expect(native.republishHomeserver).not.toHaveBeenCalled();
	expect(native.revokeGrant).not.toHaveBeenCalled();
});
it('follows a changed public mapping, ends old sessions through their own tokens, and never republishes', async () => {
	const old = {
		id: 'old-A',
		grant_id: 'ring-A',
		homeserver: PRODUCTION_HOMESERVER,
		created_at: 1,
		capabilities: ['/:rw'],
	};
	const store = createStore({ sessions: [old] });
	native.signIn.mockResolvedValueOnce(ok({ ...temporary, homeserver: STAGING_HOMESERVER }));
	native.listGrants.mockResolvedValueOnce(ok([{ grant_id: 'temporary' }, { grant_id: 'another-app-B' }]));
	(getSessionSecret as jest.Mock).mockResolvedValueOnce(ok('old-A-secret'));
	const result = await signOutRingFromHomeserver(args(store.dispatch));
	expect(result.isOk()).toBe(true);
	if (result.isOk()) expect(result.value).toEqual({ homeserver: STAGING_HOMESERVER, cleanupPending: false });
	expect(native.signOut).toHaveBeenCalledWith('old-A-secret');
	expect(native.revokeGrant.mock.calls).toEqual([['temporary-secret', 'temporary']]);
	expect(store.getState().pubkys.user).toEqual(
		expect.objectContaining({
			homeserver: STAGING_HOMESERVER,
			lastKnownHomeserver: STAGING_HOMESERVER,
			signedUp: false,
			sessions: [],
		}),
	);
	expect(native.republishHomeserver).not.toHaveBeenCalled();
	expect(native.signUp).not.toHaveBeenCalled();
});
it('does not manage an adopted key’s sessions', async () => {
	data.mockReturnValue({ ...defaultPubkyState, sourceApp: 'to.bitkit' });
	expect((await signOutRingFromHomeserver(args())).isErr()).toBe(true);
	expect(native.signIn).not.toHaveBeenCalled();
});

describe('reconnecting without changing the public mapping', () => {
	it('stores a Ring session after signing into the expected server', async () => {
		const dispatch = jest.fn();
		const result = await signInToHomeserver({ ...args(dispatch), allowRepublish: false });
		expect(result.isOk()).toBe(true);
		expect(saveSecret).toHaveBeenCalled();
		expect(dispatch).toHaveBeenLastCalledWith({
			type: 'pubky/setSignedUp',
			payload: { pubky: 'user', signedUp: true },
		});
		expect(native.signUp).not.toHaveBeenCalled();
		expect(native.republishHomeserver).not.toHaveBeenCalled();
	});
	it('returns a network error without signup or republishing', async () => {
		native.signIn.mockResolvedValueOnce(err('Offline'));
		expect((await signInToHomeserver({ ...args(), allowRepublish: false })).isErr()).toBe(true);
		expect(saveSecret).not.toHaveBeenCalled();
		expect(native.republishHomeserver).not.toHaveBeenCalled();
		expect(native.signUp).not.toHaveBeenCalled();
	});
	it('cleans up a session if the public mapping has changed to a different server', async () => {
		native.signIn.mockResolvedValueOnce(ok({ ...temporary, homeserver: `pubky://${STAGING_HOMESERVER}` }));
		const dispatch = jest.fn();
		const result = await signInToHomeserver({ ...args(dispatch), allowRepublish: false });
		expect(result.isErr()).toBe(true);
		if (!result.isErr()) throw new Error('Expected a homeserver mismatch');
		expect(result.error).toBeInstanceOf(HomeserverChangedError);
		expect(result.error).toEqual(expect.objectContaining({ homeserver: STAGING_HOMESERVER }));
		expect(native.signOut).toHaveBeenCalledWith('temporary-secret');
		expect(saveSecret).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
		expect(native.signIn).toHaveBeenCalledTimes(1);
		expect(native.republishHomeserver).not.toHaveBeenCalled();
		expect(native.signUp).not.toHaveBeenCalled();
	});
	it('does not offer a malformed returned server as a replacement', async () => {
		native.signIn.mockResolvedValueOnce(ok({ ...temporary, homeserver: 'invalid-key' }));
		const result = await signInToHomeserver({ ...args(), allowRepublish: false });
		expect(result.isErr()).toBe(true);
		if (!result.isErr()) throw new Error('Expected an invalid homeserver error');
		expect(result.error).not.toBeInstanceOf(HomeserverChangedError);
		expect(native.signOut).toHaveBeenCalledWith('temporary-secret');
		expect(saveSecret).not.toHaveBeenCalled();
	});
});

describe('homeserver discovery during import', () => {
	beforeEach(() => {
		native.getPublicKeyFromSecretKey.mockResolvedValue(ok({ public_key: 'user' }));
	});
	it('stores the imported key before signing into its discovered homeserver', async () => {
		const homeserver = 'y'.repeat(52);
		native.getHomeserver.mockResolvedValueOnce(ok(homeserver));
		native.signIn.mockResolvedValueOnce(ok({ ...temporary, homeserver }));
		const dispatch = jest.fn();
		expect((await importPubky({ secretKey: 'identity-secret', dispatch })).isOk()).toBe(true);
		expect(dispatch).toHaveBeenCalledWith({
			type: 'pubky/setHomeserver',
			payload: { pubky: 'user', homeserver },
		});
		const addedAt = dispatch.mock.calls.findIndex(([action]) => action.type === 'pubky/addPubky');
		expect(dispatch.mock.invocationCallOrder[addedAt]).toBeLessThan(
			native.signIn.mock.invocationCallOrder[0],
		);
		expect(native.signUp).not.toHaveBeenCalled();
		expect(native.republishHomeserver).not.toHaveBeenCalled();
	});
	it.each(['No homeserver found for this public key', 'Failed to get homeserver: timeout'])(
		'keeps the key imported without inventing a server or signing in when lookup returns %s',
		async message => {
			native.getHomeserver.mockResolvedValueOnce(err(message));
			const dispatch = jest.fn();
			expect((await importPubky({ secretKey: 'identity-secret', dispatch })).isOk()).toBe(true);
			expect(native.signIn).not.toHaveBeenCalled();
			expect(native.signUp).not.toHaveBeenCalled();
			expect(native.republishHomeserver).not.toHaveBeenCalled();
			expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/setHomeserver' }));
		},
	);
});
