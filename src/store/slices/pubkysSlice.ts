import { homeserverUseCount, normalizeHomeserver } from '../../utils/homeservers';
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
			const publicKey = normalizeHomeserver(action.payload.publicKey);
			if (!name || !publicKey || publicKey === defaultHomeserver.publicKey) return;
			state.homeservers ??= {};
			if (!state.homeservers[publicKey]) state.homeservers[publicKey] = { name, publicKey };
		},
		updateHomeserver: (
			state,
			action: PayloadAction<{ originalPublicKey: string; homeserver: Homeserver }>,
		) => {
			const { originalPublicKey, homeserver } = action.payload;
			const publicKey = normalizeHomeserver(homeserver.publicKey);
			const name = homeserver.name.trim();
			// A server's key is its identity. Editing only changes its shared label.
			if (!name || !publicKey || publicKey !== originalPublicKey || publicKey === defaultHomeserver.publicKey)
				return;
			if (!state.homeservers?.[publicKey] && !homeserverUseCount(state.pubkys, publicKey)) return;
			state.homeservers ??= {};
			state.homeservers[publicKey] = { name, publicKey };
		},
		setPreferredHomeserver: (state, action: PayloadAction<string>) => {
			const publicKey = normalizeHomeserver(action.payload);
			if (
				publicKey &&
				(publicKey === defaultHomeserver.publicKey ||
					state.homeservers?.[publicKey] ||
					homeserverUseCount(state.pubkys, publicKey))
			) {
				state.preferredHomeserver = publicKey;
			}
		},
		removeHomeserver: (state, action: PayloadAction<string>) => {
			const publicKey = normalizeHomeserver(action.payload);
			if (
				!publicKey ||
				publicKey === defaultHomeserver.publicKey ||
				homeserverUseCount(state.pubkys, publicKey)
			)
				return;
			delete state.homeservers?.[publicKey];
			if (state.preferredHomeserver === publicKey) state.preferredHomeserver = defaultHomeserver.publicKey;
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
				const sessionExists = state.pubkys[pubky].sessions.some(
					existingSession => existingSession.id === session.id,
				);

				if (!sessionExists) {
					state.pubkys[pubky].sessions.push({ ...session, created_at: Date.now() });
				}
			}
		},
		removeSession: (state, action: PayloadAction<{ pubky: string; sessionId: string }>) => {
			const { pubky, sessionId } = action.payload;
			if (state.pubkys[pubky]) {
				state.pubkys[pubky].sessions = state.pubkys[pubky].sessions.filter(
					session => session.id !== sessionId,
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
	setPreferredHomeserver,
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
