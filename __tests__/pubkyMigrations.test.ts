jest.mock('@synonymdev/react-native-pubky', () => ({
	__esModule: true,
	signOut: jest.fn(async () => ({
		isErr: () => false,
	})),
}));

import { signOut } from '@synonymdev/react-native-pubky';
import migrations from '../src/store/migrations';
import { EBackupPreference } from '../src/types/pubky';

const signOutMock = signOut as jest.MockedFunction<typeof signOut>;

describe('pubky migrations', () => {
	beforeEach(() => {
		jest.clearAllMocks();
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
		const migration = (migrations as unknown as Record<number, (persistedState: typeof state) => typeof state>)[7];

		const migratedState = migration(state);

		expect(signOutMock).toHaveBeenCalledWith('pubkyOne:bearer-cookie');
		expect(migratedState.pubky.pubkys.pubkyOne.sessions).toEqual([]);
	});
});
