import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	PubkyState,
	PubkySession,
	Pubky,
} from '../../types/pubky';

const initialState: PubkyState = {
	pubkys: {},
};

export const defaultPubkyState: Pubky = {
	name: '',
	homeserver: 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy',
	image: '',
	sessions: [],
};

const pubkysSlice = createSlice({
	name: 'pubky',
	initialState,
	reducers: {
		addPubky: (state, action: PayloadAction<{ pubky: string }>) => {
			state.pubkys = state?.pubkys || {};
			const { pubky } = action.payload;
			if (!state.pubkys[pubky]) {
				state.pubkys[pubky] = defaultPubkyState;
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
		setHomeserver: (state, action: PayloadAction<{ pubky: string; homeserver: string }>) => {
			const { pubky, homeserver } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].homeserver = homeserver;
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
	},
});

export const {
	addPubky,
	setImage,
	setName,
	setHomeserver,
	addSession,
	removeSession,
	removePubky,
} = pubkysSlice.actions;

export default pubkysSlice.reducer;
