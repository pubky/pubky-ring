import { persistAuthorizedGrantCounts } from '../src/store/transforms/authorizedGrantsPersistence.ts';
import type { AuthorizedGrantsState } from '../src/store/slices/authorizedGrantsSlice.ts';

describe('authorized grants persistence', () => {
	it('persists only the last known count', () => {
		const state: AuthorizedGrantsState = {
			byPubky: {
				'user-pubky': {
					grants: [
						{
							grant_id: 'grant-id',
							client_id: 'example.app',
							capabilities: '/pub/example.app/:rw',
							issued_at: 1,
							expires_at: 2,
						},
					],
					count: 1,
					sessionId: 'ring-session',
					status: 'success',
					error: 'not persisted',
					hasLoaded: true,
					requestId: 42,
				},
			},
		};

		expect(persistAuthorizedGrantCounts(state)).toEqual({
			byPubky: {
				'user-pubky': {
					grants: [],
					count: 1,
					status: 'idle',
					hasLoaded: false,
				},
			},
		});
	});
});
