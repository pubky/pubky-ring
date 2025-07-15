import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	EBackupPreference,
	ISetPubkyData,
	Pubky,
	PubkySession,
} from '../../types/pubky';
import { initialState, defaultPubkyState } from '../shapes/pubky';

const pubkysSlice = createSlice({
	name: 'pubky',
	initialState,
	reducers: {
		addPubky: (state, action: PayloadAction<{ pubky: string, backupPreference?: EBackupPreference }>) => {
			state.pubkys = state?.pubkys || {};
			const { pubky } = action.payload;
			if (!state.pubkys[pubky]) {
				state.pubkys[pubky] = {
					...defaultPubkyState,
					backupPreference: action.payload?.backupPreference ?? defaultPubkyState.backupPreference,
				};
			}
		},
		setImage: (state, action: PayloadAction<{ pubky: string; image: string }>) => {
			const { pubky, image } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].image = image;
			}
		},
		setName: (state, action: PayloadAction<{ pubky: string; name: string }>) => {
			const { pubky, name } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].name = name;
			}
		},
		setPubkyData: (state, action: PayloadAction<{ pubky: string; data: ISetPubkyData }>) => {
			const { pubky, data } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky] = {
					...state.pubkys[pubky],
					...data,
				};
			}
		},
		setDeepLink: (state, action: PayloadAction<string>) => {
			state.deepLink = action.payload;
		},
		setHomeserver: (state, action: PayloadAction<{ pubky: string; homeserver: string }>) => {
			const { pubky, homeserver } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].homeserver = homeserver;
				state.pubkys[pubky].signedUp = false;
			}
		},
		setSignedUp: (state, action: PayloadAction<{ pubky: string; signedUp: boolean }>) => {
			const { pubky, signedUp } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].signedUp = signedUp;
			}
		},
		addSession: (state, action: PayloadAction<{ pubky: string; session: PubkySession }>) => {
			const { pubky, session } = action.payload;
			if (state.pubkys[pubky]) {
				// Check if session already exists
				const sessionExists = state.pubkys[pubky].sessions.some(
					existingSession => existingSession.pubky === session.pubky
				);

				if (!sessionExists) {
					state.pubkys[pubky].sessions.push({ ...session,
						created_at: Date.now()  });
				}
			}
		},
		removeSession: (state, action: PayloadAction<{ pubky: string; sessionPubky: string }>) => {
			const { pubky, sessionPubky } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].sessions = state.pubkys[pubky].sessions.filter(
					session => session.pubky !== sessionPubky
				);
			}
		},
		removePubky: (state, action: PayloadAction<string>) => {
			delete state.pubkys[action.payload];
		},
		reorderPubkys: (state, action: PayloadAction<{ [key: string]: Pubky }>) => {
			state.pubkys = action.payload;
		},
		resetPubkys: () => {
			return { ...initialState };
		},
	},
});

export const {
	addPubky,
	setImage,
	setName,
	setPubkyData,
	setDeepLink,
	setHomeserver,
	setSignedUp,
	addSession,
	removeSession,
	removePubky,
	reorderPubkys,
	resetPubkys,
} = pubkysSlice.actions;

export default pubkysSlice.reducer;
