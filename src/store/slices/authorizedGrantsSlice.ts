import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GrantInfo } from '../../types/pubky.ts';
import { removePubky, resetPubkys } from './pubkysSlice.ts';

export type AuthorizedGrantsStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthorizedGrantsEntry {
	grants: GrantInfo[];
	count: number;
	sessionId?: string;
	status: AuthorizedGrantsStatus;
	error?: string;
	hasLoaded: boolean;
	requestId?: number;
}

export interface AuthorizedGrantsState {
	byPubky: Record<string, AuthorizedGrantsEntry>;
}

export const initialState: AuthorizedGrantsState = {
	byPubky: {},
};

const emptyEntry = (): AuthorizedGrantsEntry => ({
	grants: [],
	count: 0,
	status: 'idle',
	hasLoaded: false,
});

const authorizedGrantsSlice = createSlice({
	name: 'authorizedGrants',
	initialState,
	reducers: {
		incrementAuthorizedGrantCount: (state, action: PayloadAction<{ pubky: string }>) => {
			const { pubky } = action.payload;
			const entry = state.byPubky[pubky] ?? emptyEntry();
			state.byPubky[pubky] = {
				...entry,
				count: (entry.count ?? entry.grants.length) + 1,
			};
		},
		loadAuthorizedGrantsStarted: (state, action: PayloadAction<{ pubky: string; requestId: number }>) => {
			const { pubky, requestId } = action.payload;
			const entry = state.byPubky[pubky] ?? emptyEntry();
			state.byPubky[pubky] = {
				...entry,
				status: 'loading',
				error: undefined,
				requestId,
			};
		},
		loadAuthorizedGrantsSucceeded: (
			state,
			action: PayloadAction<{
				pubky: string;
				requestId: number;
				grants: GrantInfo[];
				sessionId: string;
			}>,
		) => {
			const { pubky, requestId, grants, sessionId } = action.payload;
			if (state.byPubky[pubky]?.requestId !== requestId) {
				return;
			}

			state.byPubky[pubky] = {
				grants,
				count: grants.length,
				sessionId,
				status: 'success',
				hasLoaded: true,
			};
		},
		loadAuthorizedGrantsFailed: (
			state,
			action: PayloadAction<{ pubky: string; requestId: number; error: string }>,
		) => {
			const { pubky, requestId, error } = action.payload;
			const entry = state.byPubky[pubky];
			if (!entry || entry.requestId !== requestId) {
				return;
			}

			state.byPubky[pubky] = {
				...entry,
				status: 'error',
				error,
				requestId: undefined,
			};
		},
		removeAuthorizedGrant: (state, action: PayloadAction<{ pubky: string; grantId: string }>) => {
			const { pubky, grantId } = action.payload;
			const entry = state.byPubky[pubky];
			if (entry) {
				const hadGrant = entry.grants.some(grant => grant.grant_id === grantId);
				entry.grants = entry.grants.filter(grant => grant.grant_id !== grantId);
				if (hadGrant) {
					entry.count = Math.max(0, (entry.count ?? entry.grants.length + 1) - 1);
				}
			}
		},
	},
	extraReducers: builder => {
		builder.addCase(removePubky, (state, action) => {
			delete state.byPubky[action.payload];
		});
		builder.addCase(resetPubkys, () => ({ byPubky: {} }));
	},
});

export const {
	incrementAuthorizedGrantCount,
	loadAuthorizedGrantsStarted,
	loadAuthorizedGrantsSucceeded,
	loadAuthorizedGrantsFailed,
	removeAuthorizedGrant,
} = authorizedGrantsSlice.actions;

export default authorizedGrantsSlice.reducer;
