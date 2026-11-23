import { signOut } from '@synonymdev/react-native-pubky';
import { ok as resultOk } from '@synonymdev/result';
import migrations from '../src/store/migrations';
import { EBackupPreference } from '../src/types/pubky';
import { getSessionSecret, resetSessionSecret } from '../src/utils/keychain';
import { createMigrate } from 'redux-persist';
import { ETheme } from '../src/types/settings';

jest.mock('@synonymdev/react-native-pubky');

jest.mock('../src/utils/keychain', () => ({
	__esModule: true,
	getSessionSecret: jest.fn(async () => {
		const { err: resultErr } = require('@synonymdev/result');
		return resultErr('missing session secret');
	}),
	resetSessionSecret: jest.fn(async () => {
		const { ok } = require('@synonymdev/result');
		return ok(true);
	}),
}));

const signOutMock = signOut as jest.MockedFunction<typeof signOut>;
const getSessionSecretMock = getSessionSecret as jest.MockedFunction<typeof getSessionSecret>;
const resetSessionSecretMock = resetSessionSecret as jest.MockedFunction<typeof resetSessionSecret>;

const runMigration = <TState>(version: number, state: TState): TState => {
	const migration = (migrations as unknown as Record<number, (persistedState: TState) => TState>)[version];
	return migration(state);
};
const flushPromises = async (): Promise<void> => {
	await new Promise(resolve => setImmediate(resolve));
};

describe('auth display settings migration', () => {
	it.each([undefined, false, true])(
		'upgrades version 10 with the existing preference %s',
		async preference => {
			const state = {
				_persist: { version: 10, rehydrated: true },
				settings: {
					theme: ETheme.light,
					...(preference === undefined ? {} : { alwaysShowAuthDetails: preference }),
				},
				pubky: { pubkys: { pubkyOne: { name: 'Alice' } } },
			};

			const migrated = await createMigrate(migrations)(state, 11);

			expect(migrated).toEqual({
				...state,
				settings: { ...state.settings, alwaysShowAuthDetails: preference ?? false },
			});
			expect(state.settings.alwaysShowAuthDetails).toBe(preference);
		},
	);
});

describe('device authentication migration', () => {
	it.each([undefined, false, true])(
		'preserves an existing preference %s and defaults off without touching credentials',
		async preference => {
			const state = {
				_persist: { version: 11, rehydrated: true },
				settings: {
					theme: ETheme.dark,
					...(preference === undefined ? {} : { requireDeviceAuth: preference }),
				},
				pubky: { pubkys: { owned: { name: 'Alice' } } },
			};
			const migrated = await createMigrate(migrations)(state, 12);
			expect(migrated).toEqual({
				...state,
				settings: { ...state.settings, requireDeviceAuth: preference ?? false },
			});
		},
	);
});

describe('pubky migrations', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signOutMock.mockResolvedValue(resultOk(''));
	});

	it('revokes legacy sessions before dropping their persisted bearer secrets', () => {
		const state = {
			pubky: {
				deepLink: '',
				processing: {},
				pubkys: {
					pubkyOne: {
						name: 'Alice',
						homeserver: 'https://homeserver.example',
						signedUp: true,
						signupToken: '',
						image: '',
						sessions: [
							{
								pubky: 'pubkyOne',
								capabilities: ['/'],
								session_secret: 'pubkyOne:bearer-cookie',
								created_at: 123,
							},
						],
						backupPreference: EBackupPreference.encryptedFile,
						isBackedUp: true,
					},
				},
			},
		};
		const migratedState = runMigration(7, state);

		expect(signOutMock).toHaveBeenCalledWith('pubkyOne:bearer-cookie');
		expect(migratedState.pubky.pubkys.pubkyOne.sessions).toEqual([]);
	});

	it('drops stored cookie sessions and clears keychain secrets for grant auth migration', async () => {
		getSessionSecretMock.mockResolvedValueOnce(resultOk('pubkyOne:stored-cookie'));
		const state = {
			pubky: {
				deepLink: '',
				processing: {},
				pubkys: {
					pubkyOne: {
						name: 'Alice',
						homeserver: 'https://homeserver.example',
						signedUp: true,
						signupToken: '',
						image: '',
						sessions: [
							{
								id: 'session-id',
								capabilities: ['/'],
								created_at: 123,
							},
						],
						backupPreference: EBackupPreference.encryptedFile,
						isBackedUp: true,
					},
				},
			},
		};

		const migratedState = runMigration(8, state);
		await flushPromises();

		expect(migratedState.pubky.pubkys.pubkyOne.sessions).toEqual([]);
		expect(getSessionSecretMock).toHaveBeenCalledWith({ pubky: 'pubkyOne', sessionId: 'session-id' });
		expect(signOutMock).toHaveBeenCalledWith('pubkyOne:stored-cookie');
		expect(resetSessionSecretMock).toHaveBeenCalledWith({ pubky: 'pubkyOne', sessionId: 'session-id' });
	});

	it('keeps existing pubkys owned by this app when adding sourceApp', () => {
		const state = {
			pubky: {
				deepLink: '',
				processing: {},
				pubkys: {
					pubkyOne: {
						name: 'Alice',
						homeserver: 'https://homeserver.example',
						signedUp: true,
						signupToken: '',
						image: '',
						sessions: [],
						backupPreference: EBackupPreference.encryptedFile,
						isBackedUp: true,
					},
				},
			},
		};

		const migratedState = runMigration(9, state);

		expect(migratedState.pubky.pubkys.pubkyOne).not.toHaveProperty('sourceApp');
	});

	it('revokes and removes development Grant sessions that have no grant id', async () => {
		getSessionSecretMock.mockResolvedValueOnce(resultOk('pubkyOne:grant-without-id'));
		const state = {
			pubky: {
				deepLink: '',
				processing: {},
				pubkys: {
					pubkyOne: {
						name: 'Alice',
						homeserver: 'https://homeserver.example',
						signedUp: true,
						signupToken: '',
						image: '',
						sessions: [
							{
								id: 'session-without-grant-id',
								capabilities: ['/:rw'],
								created_at: 123,
							},
							{
								id: 'current-session',
								grant_id: 'current-grant',
								capabilities: ['/:rw'],
								created_at: 456,
							},
						],
						backupPreference: EBackupPreference.encryptedFile,
						isBackedUp: true,
					},
				},
			},
		};

		const migratedState = runMigration(10, state);
		await flushPromises();

		expect(migratedState.pubky.pubkys.pubkyOne.sessions).toEqual([
			{
				id: 'current-session',
				grant_id: 'current-grant',
				capabilities: ['/:rw'],
				created_at: 456,
			},
		]);
		expect(getSessionSecretMock).toHaveBeenCalledWith({
			pubky: 'pubkyOne',
			sessionId: 'session-without-grant-id',
		});
		expect(signOutMock).toHaveBeenCalledWith('pubkyOne:grant-without-id');
		expect(resetSessionSecretMock).toHaveBeenCalledWith({
			pubky: 'pubkyOne',
			sessionId: 'session-without-grant-id',
		});
	});
});

describe('unnamed pubky labels migration', () => {
	const pubkyState = (pubkys: Record<string, Record<string, unknown>>) => ({
		_persist: { version: 14, rehydrated: true },
		pubky: { pubkys, deepLink: '', homeservers: {}, processing: {} },
		settings: { theme: ETheme.dark },
	});

	it('stores the label each unnamed pubky shows today and keeps names, order and other state', async () => {
		const state = pubkyState({
			first: { name: '', homeserver: 'hs', isBackedUp: true },
			second: { name: 'Work' },
			third: { name: '' },
			adopted: { name: 'pubky #4 (Bitkit)', sourceApp: 'bitkit' },
		});
		const migrated = (await createMigrate(migrations)(state, 15)) as unknown as typeof state;

		expect(Object.keys(migrated.pubky.pubkys)).toEqual(['first', 'second', 'third', 'adopted']);
		expect(migrated.pubky.pubkys).toEqual({
			first: { name: 'pubky #1', homeserver: 'hs', isBackedUp: true },
			second: { name: 'Work' },
			third: { name: 'pubky #3' },
			adopted: { name: 'pubky #4 (Bitkit)', sourceApp: 'bitkit' },
		});
		expect(migrated.settings).toEqual(state.settings);
	});

	it('gives an unnamed pubky the next free number when another pubky is already named after its label', () => {
		const migrated = runMigration(
			15,
			pubkyState({
				first: { name: 'Work' },
				second: { name: '' },
				third: { name: 'pubky #2' },
			}),
		);

		expect(migrated.pubky.pubkys).toEqual({
			first: { name: 'Work' },
			second: { name: 'pubky #3' },
			third: { name: 'pubky #2' },
		});
	});

	it('handles state without pubkys', () => {
		const empty = pubkyState({});
		expect(runMigration(15, empty)).toEqual(empty);
		expect(runMigration(15, undefined)).toBeUndefined();
		const withoutPubkyState = { _persist: { version: 14, rehydrated: true } };
		expect(runMigration(15, withoutPubkyState)).toEqual(withoutPubkyState);
	});
});
