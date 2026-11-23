import { canManagePubkyGrants, canPubkyAuthorize, getPubkyName } from '../src/store/selectors/pubkySelectors';
import { defaultPubkyState } from '../src/store/shapes/pubky';

jest.mock('@reduxjs/toolkit', () => ({
	createSelector: (...args: Array<unknown>) => {
		const projector = args.at(-1) as (...values: Array<unknown>) => unknown;
		const selectors = args.slice(0, -1).flat() as Array<(...callArgs: Array<unknown>) => unknown>;

		return (...callArgs: Array<unknown>) => projector(...selectors.map(selector => selector(...callArgs)));
	},
}));

jest.mock('../src/utils/pubky.ts', () => ({
	truncateStr: (value: string) => value,
}));

describe('pubky grant management selectors', () => {
	it('allows Ring-owned signed-up pubkys to manage grants', () => {
		const pubky = { ...defaultPubkyState, signedUp: true };

		expect(canPubkyAuthorize(pubky)).toBe(true);
		expect(canManagePubkyGrants(pubky)).toBe(true);
	});

	it('allows adopted pubkys to authorize without trying to manage their grants', () => {
		const pubky = { ...defaultPubkyState, signedUp: true, sourceApp: 'example.app' };

		expect(canPubkyAuthorize(pubky)).toBe(true);
		expect(canManagePubkyGrants(pubky)).toBe(false);
	});

	it('does not manage grants for an unconfigured pubky', () => {
		expect(canManagePubkyGrants(defaultPubkyState)).toBe(false);
	});
});

describe('getPubkyName', () => {
	const state = (pubkys: Record<string, { name: string }>) =>
		({ pubky: { pubkys } }) as unknown as Parameters<typeof getPubkyName>[0];

	it('shows the stored name, not a label derived from the list position', () => {
		const pubkys = { a: { name: 'pubky #3' }, b: { name: 'Work' } };
		expect(getPubkyName(state(pubkys), 'a')).toBe('pubky #3');
		const reordered = { b: pubkys.b, a: pubkys.a };
		expect(getPubkyName(state(reordered), 'a')).toBe('pubky #3');
	});

	it('shows the placeholder for a pubky without a name', () => {
		expect(getPubkyName(state({ a: { name: 'Work' }, b: { name: '' } }), 'b')).toBe('pubky');
		expect(getPubkyName(state({}), 'missing')).toBe('pubky');
	});
});
