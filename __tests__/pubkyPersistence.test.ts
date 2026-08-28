import { sanitizePubkySessions } from '../src/store/transforms/pubkyPersistence';
import { EBackupPreference, PubkyState } from '../src/types/pubky';

describe('pubky persistence', () => {
	it('persists session metadata without bearer secrets', () => {
		const state = {
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
		};

		expect(sanitizePubkySessions(state as unknown as PubkyState)).toEqual({
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
		});
	});

	it('drops legacy sessions that cannot be matched to a keychain secret', () => {
		const state = {
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
		};

		expect(sanitizePubkySessions(state as unknown as PubkyState).pubkys.pubkyOne.sessions).toEqual([]);
	});
});
