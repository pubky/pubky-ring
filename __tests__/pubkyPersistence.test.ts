import { sanitizePersistedPubkyState, sanitizePubkySessions } from '../src/store/transforms/pubkyPersistence';
import { EBackupPreference, PubkyState } from '../src/types/pubky';

describe('pubky persistence', () => {
	it('persists session metadata without bearer secrets', () => {
		const state = {
			deepLink: '',
			deepLinkQueue: [],
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
			deepLinkQueue: [],
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
			deepLinkQueue: [],
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

	it('removes queued credentials and session secrets in the same persistence pass', () => {
		const state = {
			deepLink: 'pubkyauth:///?secret=legacy-secret',
			deepLinkQueue: [
				{
					id: 'delivery-id',
					deepLink: JSON.stringify({ rawInput: 'pubkyauth:///?secret=queued-secret' }),
				},
			],
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
							session_secret: 'session-secret',
							created_at: 123,
						},
					],
					backupPreference: EBackupPreference.encryptedFile,
					isBackedUp: true,
				},
			},
		};

		const persisted = sanitizePersistedPubkyState(state as unknown as PubkyState);
		const serialized = JSON.stringify(persisted);

		expect(persisted.deepLink).toBe('');
		expect(persisted.deepLinkQueue).toEqual([]);
		expect(persisted.pubkys.pubkyOne.sessions).toEqual([
			{
				id: 'session-id',
				capabilities: ['/'],
				created_at: 123,
			},
		]);
		expect(serialized).not.toContain('legacy-secret');
		expect(serialized).not.toContain('queued-secret');
		expect(serialized).not.toContain('session-secret');
	});
});
