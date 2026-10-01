import type { AuthorizedGrantsState } from '../slices/authorizedGrantsSlice.ts';

export const persistAuthorizedGrantCounts = (state: AuthorizedGrantsState): AuthorizedGrantsState => ({
	byPubky: Object.fromEntries(
		Object.entries(state.byPubky ?? {}).map(([pubky, entry]) => [
			pubky,
			{
				grants: [],
				count:
					Number.isSafeInteger(entry.count) && entry.count >= 0 ? entry.count : (entry.grants?.length ?? 0),
				status: 'idle' as const,
				hasLoaded: false,
			},
		]),
	),
});
