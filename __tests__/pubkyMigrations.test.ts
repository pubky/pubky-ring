import { signOut } from '@synonymdev/react-native-pubky';
import { ok as resultOk } from '@synonymdev/result';
import migrations from '../src/store/migrations';
import { EBackupPreference } from '../src/types/pubky';
import { getSessionSecret, resetSessionSecret } from '../src/utils/keychain';

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
});
