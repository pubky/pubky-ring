import type { Dispatch } from 'redux';
import type { Pubky } from '../../types/pubky';
import { setPubkyData } from '../../store/slices/pubkysSlice';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver } from '../pubky';
import { normalizeHomeserver } from '../homeservers';
import { HomeserverChangedError } from '../homeserverChangedError';

interface SubmitEditPubkyArgs {
	pubky: string;
	storedPubkyData?: Pubky;
	name: string;
	homeserver: string;
	signupToken: string;
	linkedHomeserver?: string;
	dispatch: Dispatch;
}

type SubmitEditPubkyResult =
	| { success: true }
	| { success: false; type: 'homeserverChanged'; homeserver: string }
	| { success: false; type: 'secretKey' | 'signup' | 'signin'; message?: string };

export const submitEditPubky = async ({
	pubky,
	storedPubkyData,
	name,
	homeserver,
	signupToken,
	linkedHomeserver,
	dispatch,
}: SubmitEditPubkyArgs): Promise<SubmitEditPubkyResult> => {
	const trimmedName = name.trim();
	const storedHomeserver =
		normalizeHomeserver(storedPubkyData?.homeserver ?? '') ?? storedPubkyData?.homeserver ?? '';
	const selectedHomeserver = normalizeHomeserver(homeserver) ?? homeserver.trim();
	if (storedPubkyData?.sourceApp) {
		dispatch(setPubkyData({ pubky, data: { name: trimmedName } }));
		return { success: true };
	}
	if (storedPubkyData?.signedUp && storedHomeserver === selectedHomeserver) {
		dispatch(
			setPubkyData({ pubky, data: { name: trimmedName, homeserver: storedHomeserver, signupToken: '' } }),
		);
		return { success: true };
	}
	if (!selectedHomeserver) {
		// Signing out is a separate confirmed action, never an effect of Save.
		if (storedPubkyData?.signedUp || storedPubkyData?.sessions?.some(session => !session.cleanupOnly)) {
			return { success: false, type: 'signup' };
		}

		dispatch(
			setPubkyData({ pubky, data: { name: trimmedName, homeserver: '', signupToken: '', signedUp: false } }),
		);
		return { success: true };
	}
	if (!normalizeHomeserver(selectedHomeserver)) return { success: false, type: 'signup' };
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) return { success: false, type: 'secretKey', message: secretKeyRes.error.message };
	const secretKey = secretKeyRes.value.secretKey;
	const reconnecting = normalizeHomeserver(linkedHomeserver) === selectedHomeserver;
	const connectionRes = reconnecting
		? await signInToHomeserver({
				pubky,
				homeserver: selectedHomeserver,
				secretKey,
				dispatch,
				allowRepublish: false,
			})
		: await signUpToHomeserver({
				pubky,
				homeserver: selectedHomeserver,
				signupToken,
				secretKey,
				dispatch,
			});
	if (connectionRes.isErr()) {
		if (reconnecting && connectionRes.error instanceof HomeserverChangedError) {
			return { success: false, type: 'homeserverChanged', homeserver: connectionRes.error.homeserver };
		}
		return { success: false, type: reconnecting ? 'signin' : 'signup', message: connectionRes.error.message };
	}
	// Both operations store their management session. Never retry signup after a sign-in failure.
	dispatch(
		setPubkyData({ pubky, data: { name: trimmedName, homeserver: selectedHomeserver, signupToken: '' } }),
	);
	return { success: true };
};
