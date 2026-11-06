import reducer, {
	addHomeserver,
	updateHomeserver,
	removeHomeserver,
	setPreferredHomeserver,
} from '../src/store/slices/pubkysSlice';
import { getHomeservers, getPreferredHomeserver } from '../src/store/selectors/pubkySelectors';
import { defaultHomeserver, defaultPubkyState, initialState } from '../src/store/shapes/pubky';
import { homeserverUseCount, normalizeHomeserver } from '../src/utils/homeservers';
import { PRODUCTION_HOMESERVER, STAGING_HOMESERVER } from '../src/utils/constants';
import type { RootState } from '../src/types';

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('../src/utils/pubky', () => ({ truncateStr: (value: string) => value }));
const CUSTOM = 'y'.repeat(52);
const OTHER = PRODUCTION_HOMESERVER;
const custom = { name: 'Custom', publicKey: CUSTOM };
const stateWithCustom = () => reducer(initialState, addHomeserver(custom));
const root = (pubky: typeof initialState) => ({ pubky }) as RootState;

describe('homeserver catalog', () => {
	it('normalizes public-key URIs and rejects malformed keys, paths, and noncanonical padding', () => {
		expect(normalizeHomeserver(`  pubky://${CUSTOM.toUpperCase()}/  `)).toBe(CUSTOM);
		expect(normalizeHomeserver(`pk:${STAGING_HOMESERVER}`)).toBe(STAGING_HOMESERVER);
		for (const invalid of [
			'example.com',
			CUSTOM.slice(1),
			`${CUSTOM}/path`,
			`${CUSTOM}?query=1`,
			`${CUSTOM.slice(0, -1)}b`,
			'a'.repeat(52),
		]) {
			expect(normalizeHomeserver(invalid)).toBeUndefined();
		}
	});
	it('deduplicates normalized keys and does not replace a saved label', () => {
		const state = stateWithCustom();
		expect(reducer(state, addHomeserver({ name: 'Duplicate', publicKey: `pubky://${CUSTOM}` }))).toEqual(
			state,
		);
		expect(reducer(state, addHomeserver({ name: 'Invalid', publicKey: 'bad' }))).toEqual(state);
	});
	it('renames a shared server without changing either key or its sessions', () => {
		const session = { id: 'id', grant_id: 'grant', capabilities: [], created_at: 1 };
		const state = {
			...stateWithCustom(),
			pubkys: {
				one: { ...defaultPubkyState, homeserver: CUSTOM, signedUp: true, sessions: [session] },
				two: { ...defaultPubkyState, homeserver: CUSTOM, signedUp: true, sessions: [session] },
			},
		};
		const next = reducer(
			state,
			updateHomeserver({ originalPublicKey: CUSTOM, homeserver: { ...custom, name: 'Renamed' } }),
		);
		expect(next.pubkys).toEqual(state.pubkys);
		expect(homeserverUseCount(next.pubkys, CUSTOM)).toBe(2);
		expect(getHomeservers(root(next)).find(server => server.publicKey === CUSTOM)?.name).toBe('Renamed');
		expect(reducer(state, removeHomeserver(CUSTOM))).toEqual(state);
		expect(
			reducer(
				state,
				updateHomeserver({ originalPublicKey: CUSTOM, homeserver: { name: 'Changed', publicKey: OTHER } }),
			),
		).toEqual(state);
	});
	it('changes the future default without changing existing pubkys, and falls back on removal', () => {
		const state = {
			...stateWithCustom(),
			pubkys: { one: { ...defaultPubkyState, homeserver: OTHER, signedUp: true } },
		};
		const preferred = reducer(state, setPreferredHomeserver(CUSTOM));
		expect(getPreferredHomeserver(root(preferred))).toBe(CUSTOM);
		expect(preferred.pubkys).toEqual(state.pubkys);
		const removed = reducer(preferred, removeHomeserver(CUSTOM));
		expect(removed.preferredHomeserver).toBe(defaultHomeserver.publicKey);
		expect(reducer(removed, removeHomeserver(defaultHomeserver.publicKey))).toEqual(removed);
	});
	it('includes an imported key’s current server and permits giving it a shared label', () => {
		const state = {
			...initialState,
			pubkys: { imported: { ...defaultPubkyState, homeserver: `pubky://${CUSTOM}` } },
		};
		expect(getHomeservers(root(state)).some(server => server.publicKey === CUSTOM)).toBe(true);
		const next = reducer(state, updateHomeserver({ originalPublicKey: CUSTOM, homeserver: custom }));
		expect(next.homeservers[CUSTOM]).toEqual(custom);
		expect(reducer(next, removeHomeserver(CUSTOM))).toEqual(next);
	});
});
