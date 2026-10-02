import type { RootState } from '../../types';
import type { AuthorizedGrantsEntry } from '../slices/authorizedGrantsSlice.ts';

const emptyEntry: AuthorizedGrantsEntry = {
	grants: [],
	count: 0,
	status: 'idle',
	hasLoaded: false,
};

export const getAuthorizedGrantsEntry = (state: RootState, pubky: string): AuthorizedGrantsEntry =>
	state.authorizedGrants.byPubky[pubky] ?? emptyEntry;

export const getAuthorizedGrantCount = (state: RootState, pubky: string): number => {
	const entry = getAuthorizedGrantsEntry(state, pubky);
	return entry.count ?? entry.grants.length;
};
