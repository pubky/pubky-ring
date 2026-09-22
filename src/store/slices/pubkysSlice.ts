import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EBackupPreference, ISetPubkyData, Pubky, PubkySession } from '../../types/pubky';
import { initialState, defaultPubkyState } from '../shapes/pubky';

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
				sourceApp?: 'app.pubkyring' | 'to.bitkit';
			}>,
		) => {
			state.pubkys = state?.pubkys || {};
			const {
				pubky,
				backupPreference,
				isBackedUp = false,
				signupToken = '',
				sourceApp = 'app.pubkyring',
			} = action.payload;
			if (!state.pubkys[pubky]) {
				state.pubkys[pubky] = {
					...defaultPubkyState,
					backupPreference: backupPreference ?? defaultPubkyState.backupPreference,
					isBackedUp,
					signupToken,
					sourceApp,
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
		disconnectBorrowedPubky: (state, action: PayloadAction<{ pubky: string; sessionPubkys: string[] }>) => {
			const { pubky, sessionPubkys } = action.payload;
			if (state.pubkys[pubky]?.sourceApp !== 'to.bitkit') return;
			// Persist removal and its retry target together: a failed delete must never leave either
			// an active borrowed identity or an unreachable private session secret.
			state.pendingSessionCleanup ??= {};
			state.pendingSessionCleanup[pubky] = sessionPubkys;
			delete state.pubkys[pubky];
		},
		completePubkySessionCleanup: (state, action: PayloadAction<string>) => {
			delete state.pendingSessionCleanup?.[action.payload];
		},
		queuePubkySessionCleanup: (state, action: PayloadAction<{ pubky: string; sessionPubkys: string[] }>) => {
			state.pendingSessionCleanup ??= {};
			state.pendingSessionCleanup[action.payload.pubky] = action.payload.sessionPubkys;
		},
		refreshPubkySessionCleanup: state => {
			// A failed MMKV write may have drained redux-persist's queue. A new slice reference
			// makes the next flush serialize the current cleanup state again.
			state.pendingSessionCleanup = { ...state.pendingSessionCleanup };
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
	disconnectBorrowedPubky,
	completePubkySessionCleanup,
	queuePubkySessionCleanup,
	refreshPubkySessionCleanup,
	reorderPubkys,
	resetPubkys,
	addProcessing,
	removeProcessing,
} = pubkysSlice.actions;

export default pubkysSlice.reducer;
