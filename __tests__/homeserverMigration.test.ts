import { createMigrate } from 'redux-persist';
import migrations from '../src/store/migrations';
import { defaultHomeserver } from '../src/store/shapes/pubky';

jest.mock('../src/utils/keychain', () => ({
	getSessionSecret: jest.fn(),
	resetSessionSecret: jest.fn(),
}));

describe('homeserver migration', () => {
	it('upgrades a version 12 store through the catalog default migration without changing sessions or adopted identities', async () => {
		const session = { id: 'session', grant_id: 'grant', capabilities: [] };
		const pubkys = {
			legacy: { signedUp: true, homeserver: '', sessions: [session] },
			custom: { signedUp: true, homeserver: 'y'.repeat(52), sessions: [session] },
			unsigned: { signedUp: false, homeserver: '' },
			adopted: { signedUp: true, homeserver: '', sourceApp: 'to.bitkit' },
		};
		const customServer = { name: 'Custom', publicKey: 'y'.repeat(52) };
		const state = {
			_persist: { version: 12, rehydrated: true },
			pubky: { pubkys, homeservers: { [customServer.publicKey]: customServer } },
			settings: { requireDeviceAuth: true },
			authorizedGrants: { counts: { legacy: 2 } },
		};

		const migrated = await createMigrate(migrations)(state, 14);

		expect(migrated).toEqual({
			...state,
			pubky: {
				preferredHomeserver: defaultHomeserver.publicKey,
				pubkys: { ...pubkys, legacy: { ...pubkys.legacy, homeserver: defaultHomeserver.publicKey } },
				homeservers: {
					[customServer.publicKey]: customServer,
					[defaultHomeserver.publicKey]: defaultHomeserver,
				},
			},
		});
		expect(pubkys.legacy.homeserver).toBe('');
	});
	it('normalizes an older saved URI entry and its preferred key without touching Pubkys', async () => {
		const key = 'y'.repeat(52);
		const state = {
			_persist: { version: 13, rehydrated: true },
			pubky: {
				pubkys: {},
				preferredHomeserver: `pubky://${key}`,
				homeservers: {
					[`pubky://${key}`]: { name: 'Personal', publicKey: `pubky://${key}` },
				},
			},
		};
		expect(await createMigrate(migrations)(state, 14)).toEqual({
			...state,
			pubky: {
				...state.pubky,
				preferredHomeserver: key,
				homeservers: {
					[defaultHomeserver.publicKey]: defaultHomeserver,
					[key]: { name: 'Personal', publicKey: key },
				},
			},
		});
	});
});
