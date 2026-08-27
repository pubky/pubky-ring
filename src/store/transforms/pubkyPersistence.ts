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
					// Legacy sessions without ids cannot resolve Keychain secrets.
					.filter(session => typeof session.id === 'string' && session.id.length > 0)
					// Persist only non-secret session metadata.
					.map(session => ({
						id: session.id,
						capabilities: session.capabilities,
						created_at: session.created_at,
					})),
			},
		]),
	),
});
