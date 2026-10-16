import { initialState as pubkyInitialState } from '../shapes/pubky';

type PubkySliceState = typeof pubkyInitialState;

export const sanitizePubkySessions = (state: PubkySliceState): PubkySliceState => ({
	...state,
	pubkys: Object.fromEntries(
		Object.entries(state.pubkys ?? {}).map(([pubky, pubkyState]) => [
			pubky,
			{
				...pubkyState,
				sessions: (pubkyState.sessions ?? [])
					// Only persist sessions that can resolve their Keychain secret and
					// be excluded precisely from the revocable grant list.
					.filter(
						session =>
							typeof session.id === 'string' &&
							session.id.length > 0 &&
							typeof session.grant_id === 'string' &&
							session.grant_id.length > 0,
					)
					// Persist only non-secret session metadata.
					.map(session => ({
						id: session.id,
						grant_id: session.grant_id,
						capabilities: session.capabilities,
						created_at: session.created_at,
					})),
			},
		]),
	),
});
