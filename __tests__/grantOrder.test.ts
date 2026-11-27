import { sortGrantsForDisplay } from '../src/utils/grantOrder.ts';
import type { GrantInfo } from '../src/types/pubky.ts';

const grant = (grant_id: string, client_id: string, issued_at: number): GrantInfo => ({
	grant_id,
	client_id,
	capabilities: '/pub/:rw',
	issued_at,
	expires_at: issued_at + 1000,
});

const ids = (grants: GrantInfo[]): string[] => grants.map(g => g.grant_id);

describe('sortGrantsForDisplay', () => {
	it('groups grants by client id, newest first within each client', () => {
		const grants = [
			grant('g1', 'to.pubky.ring', 10),
			grant('g2', 'locks.staging.pubky.app', 20),
			grant('g3', 'to.pubky.ring', 30),
			grant('g4', 'app.paykit.server', 5),
			grant('g5', 'locks.staging.pubky.app', 40),
		];

		expect(ids(sortGrantsForDisplay(grants))).toEqual(['g4', 'g5', 'g2', 'g3', 'g1']);
	});

	it('gives the same order whatever order the homeserver returns', () => {
		const grants = [
			grant('g1', 'b.app', 1),
			grant('g2', 'a.app', 2),
			grant('g3', 'b.app', 3),
			grant('g4', 'a.app', 4),
		];
		const expected = ['g4', 'g2', 'g3', 'g1'];

		expect(ids(sortGrantsForDisplay(grants))).toEqual(expected);
		expect(ids(sortGrantsForDisplay([...grants].reverse()))).toEqual(expected);
	});

	it('breaks a tie on issue time by grant id', () => {
		const grants = [grant('g2', 'a.app', 1), grant('g1', 'a.app', 1)];

		expect(ids(sortGrantsForDisplay(grants))).toEqual(['g1', 'g2']);
		expect(ids(sortGrantsForDisplay([...grants].reverse()))).toEqual(['g1', 'g2']);
	});

	it('leaves the input array in its original order', () => {
		const grants = [grant('g1', 'b.app', 1), grant('g2', 'a.app', 2)];
		const sorted = sortGrantsForDisplay(grants);

		expect(ids(sorted)).toEqual(['g2', 'g1']);
		expect(ids(grants)).toEqual(['g1', 'g2']);
	});
});
