import { Dispatch } from 'redux';
import { ISetPubkyData, Pubky } from '../../types/pubky.ts';
import { setPubkyData } from '../../store/slices/pubkysSlice.ts';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver } from '../pubky.ts';

interface SubmitEditPubkyArgs {
	pubky: string;
	storedPubkyData?: Pubky;
	name: string;
	homeserver: string;
	signupToken: string;
	dispatch: Dispatch;
}

type SubmitEditPubkyResult =
	| { success: true }
	| { success: false; type: 'secretKey' | 'signup' | 'signin'; message?: string };

const isSignupTokenError = (errorMessage: string): boolean => {
	return (
		errorMessage.includes('Token required') ||
		errorMessage.includes('Invalid token') ||
		errorMessage.includes('Token already used')
	);
};

export const submitEditPubky = async ({
	pubky,
	storedPubkyData,
	name,
	homeserver,
	signupToken,
	dispatch,
}: SubmitEditPubkyArgs): Promise<SubmitEditPubkyResult> => {
	const trimmedName = name.trim();
	const trimmedHomeserver = homeserver.trim();
	const storedHomeserver = storedPubkyData?.homeserver ?? '';
	const storedSignedUp = storedPubkyData?.signedUp ?? false;

	const saveName = (): void => {
		dispatch(
			setPubkyData({
				pubky,
				data: { name: trimmedName },
			}),
		);
	};

	if (storedSignedUp && storedHomeserver === trimmedHomeserver) {
		dispatch(
			setPubkyData({
				pubky,
				data: {
					name: trimmedName,
					homeserver: trimmedHomeserver,
				},
			}),
		);
		return { success: true };
	}

	const shouldAuthenticateHomeserver =
		Boolean(trimmedHomeserver) && (!storedSignedUp || storedHomeserver !== trimmedHomeserver);

	let newData: ISetPubkyData = {
		name: trimmedName,
		homeserver: trimmedHomeserver,
	};
	if (!trimmedHomeserver) {
		newData.signedUp = false;
		newData.signupToken = '';
	}

	if (shouldAuthenticateHomeserver) {
		const secretKeyRes = await getPubkySecretKey(pubky);
		if (secretKeyRes.isErr()) {
			saveName();
			return { success: false, type: 'secretKey', message: secretKeyRes.error.message };
		}

		const secretKey = secretKeyRes.value.secretKey;
		let signedIn = false;
		const signupRes = await signUpToHomeserver({
			pubky,
			homeserver: trimmedHomeserver,
			signupToken,
			secretKey,
			dispatch,
		});

		if (signupRes.isErr()) {
			if (isSignupTokenError(signupRes.error.message)) {
				saveName();
				return { success: false, type: 'signup', message: signupRes.error.message };
			}

			if (!storedHomeserver || storedHomeserver === trimmedHomeserver) {
				const signinRes = await signInToHomeserver({
					pubky,
					homeserver: trimmedHomeserver,
					secretKey,
					dispatch,
				});
				if (signinRes.isErr()) {
					saveName();
					return { success: false, type: 'signup' };
				}
				signedIn = true;
			} else {
				saveName();
				return { success: false, type: 'signup' };
			}
		}

		newData = {
			...newData,
			signupToken: '',
		};

		if (!signedIn) {
			const signinRes = await signInToHomeserver({
				pubky,
				homeserver: trimmedHomeserver,
				secretKey,
				dispatch,
			});
			if (signinRes.isErr()) {
				saveName();
				return { success: false, type: 'signin', message: signinRes.error.message };
			}
		}
	}

	dispatch(setPubkyData({ pubky, data: newData }));
	return { success: true };
};
