/**
 * Invite Action Handler
 *
 * Handles invite codes that create a new pubky and sign up to a homeserver.
 * This is simpler than the signup flow - no auth step is performed.
 */

import { Result, ok, err } from '@synonymdev/result';
import { InputAction, InviteParams } from '../inputParser';
import { RoutedActionContext } from '../inputRouter';
import { createPubkyWithInviteCode } from '../pubky';
import { getErrorMessage } from '../errorHandler';
import { openXSuccess, openXError } from '../xCallback';
import { setLoadingModalError } from '../../store/slices/uiSlice';
import i18n from '../../i18n';
import { Dispatch } from 'redux';
import { getSignupTokenErrorModalFields, LoadingErrorModalFields } from '../signupErrors';

type InviteActionData = {
	action: InputAction.Invite;
	params: InviteParams;
};

/**
 * Transitions the loading modal to error state via Redux
 */
const showErrorState = (
	errorMessage: string,
	dispatch: Dispatch,
	fields: LoadingErrorModalFields = {},
): void => {
	// Update Redux state to show error
	dispatch(
		setLoadingModalError({
			isError: true,
			...fields,
			errorMessage: errorMessage,
		}),
	);
};

/**
 * Handles invite action - creates a new pubky and signs up with the invite code
 *
 * @returns The created pubky string on success
 */
export const handleInviteAction = async (
	data: InviteActionData,
	context: RoutedActionContext,
): Promise<Result<string>> => {
	const { dispatch } = context;
	const { params } = data;
	const { inviteCode, xCallback } = params;

	context.setAddPubkyScreen({ screen: 'Loading' });

	try {
		// Create pubky and sign up with invite code automatically
		const createRes = await createPubkyWithInviteCode(inviteCode, dispatch);

		if (createRes.isErr()) {
			const errorMessage = getErrorMessage(createRes.error, i18n.t('errors.failedToCreatePubkyWithInvite'));
			showErrorState(errorMessage, dispatch, getSignupTokenErrorModalFields(errorMessage));
			await openXError(xCallback, 'INVITE_FAILED', errorMessage);
			return err(errorMessage);
		}

		const { pubky } = createRes.value;

		await openXSuccess(xCallback);

		context.setAddPubkyScreen({
			screen: 'Welcome',
			params: {
				pubky,
				isInvite: true,
			},
		});

		return ok(pubky);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : i18n.t('invite.unknownErrorProcessing');
		console.error('Error handling invite code:', errorMessage);
		showErrorState(i18n.t('errors.inviteProcessingFailed'), dispatch);
		await openXError(xCallback, 'INVITE_ERROR', errorMessage);
		return err(errorMessage);
	}
};
