import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EBackupPreference, Homeserver, ISetPubkyData, Pubky, PubkySession } from '../../types/pubky';
import { initialState, defaultHomeserver, defaultPubkyState } from '../shapes/pubky';

const pubkysSlice = createSlice({
	name: 'pubky',
	initialState,
	reducers: {
		addPubky: (
			state,
			action: PayloadAction<{
				pubky: string;
				backupPreference?: EBackupPreference;
				isBackedUp?: boolean;
				signupToken?: string;
			}>,
		) => {
			state.pubkys = state?.pubkys || {};
			const { pubky, backupPreference, isBackedUp = false, signupToken = '' } = action.payload;
			if (!state.pubkys[pubky]) {
				state.pubkys[pubky] = {
					...defaultPubkyState,
					backupPreference: backupPreference ?? defaultPubkyState.backupPreference,
					isBackedUp,
					signupToken,
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
			}
		},
		addHomeserver: (state, action: PayloadAction<Homeserver>) => {
			const name = action.payload.name.trim();
			const publicKey = action.payload.publicKey.trim();

			if (!name || !publicKey || publicKey === defaultHomeserver.publicKey) {
				return;
			}

			state.homeservers = state.homeservers || {};
			if (!state.homeservers[publicKey]) {
				state.homeservers[publicKey] = { name, publicKey };
			}
		},
		updateHomeserver: (
			state,
			action: PayloadAction<{ originalPublicKey: string; homeserver: Homeserver }>,
		) => {
			const { originalPublicKey } = action.payload;
			const name = action.payload.homeserver.name.trim();
			const publicKey = action.payload.homeserver.publicKey.trim();

			if (
				!name ||
				!publicKey ||
				originalPublicKey === defaultHomeserver.publicKey ||
				publicKey === defaultHomeserver.publicKey ||
				!state.homeservers?.[originalPublicKey] ||
				(publicKey !== originalPublicKey && state.homeservers[publicKey])
			) {
				return;
			}

			delete state.homeservers[originalPublicKey];
			state.homeservers[publicKey] = { name, publicKey };
		},
		removeHomeserver: (state, action: PayloadAction<string>) => {
			const publicKey = action.payload.trim();

			if (!publicKey || publicKey === defaultHomeserver.publicKey) {
				return;
			}

			delete state.homeservers?.[publicKey];
		},
		setSignedUp: (state, action: PayloadAction<{ pubky: string; signedUp: boolean }>) => {
			const { pubky, signedUp } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].signedUp = signedUp;
			}
		},
		addProcessing: (state, action: PayloadAction<{ pubky: string }>) => {
			const { pubky } = action.payload;
			state.processing[pubky] = true;
		},
		removeProcessing: (state, action: PayloadAction<{ pubky: string }>) => {
			const { pubky } = action.payload;
			delete state.processing[pubky];
		},
		addSession: (state, action: PayloadAction<{ pubky: string; session: PubkySession }>) => {
			const { pubky, session } = action.payload;
			if (state.pubkys[pubky]) {
				// Check if session already exists by session_secret
				const sessionExists = state.pubkys[pubky].sessions.some(
					existingSession => existingSession.session_secret === session.session_secret,
				);

				if (!sessionExists) {
					state.pubkys[pubky].sessions.push({ ...session, created_at: Date.now() });
				}
			}
		},
		removeSession: (state, action: PayloadAction<{ pubky: string; session_secret: string }>) => {
			const { pubky, session_secret } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].sessions = state.pubkys[pubky].sessions.filter(
					session => session.session_secret !== session_secret,
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
	addHomeserver,
	updateHomeserver,
	removeHomeserver,
	setSignedUp,
	addSession,
	removeSession,
	removePubky,
	reorderPubkys,
	resetPubkys,
	addProcessing,
	removeProcessing,
} = pubkysSlice.actions;

export default pubkysSlice.reducer;
