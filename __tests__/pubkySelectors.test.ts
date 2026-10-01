import { canManagePubkyGrants, canPubkyAuthorize } from '../src/store/selectors/pubkySelectors';
import { defaultPubkyState } from '../src/store/shapes/pubky';

jest.mock('@reduxjs/toolkit', () => ({
	createSelector: (...args: Array<unknown>) => {
		const projector = args.at(-1) as (...values: Array<unknown>) => unknown;
		const selectors = args
			.slice(0, -1)
			.flat() as Array<(...callArgs: Array<unknown>) => unknown>;

		return (...callArgs: Array<unknown>) =>
			projector(...selectors.map(selector => selector(...callArgs)));
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
