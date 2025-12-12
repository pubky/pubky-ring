/**
 * Invite Action Handler
 *
 * Handles invite codes that create a new pubky and sign up to a homeserver.
 * This is simpler than the signup flow - no auth step is performed.
 */

import { Result, ok, err } from '@synonymdev/result';
import { SheetManager } from 'react-native-actions-sheet';
import { InputAction, InviteParams } from '../inputParser';
import { ActionContext } from '../inputRouter';
import { createPubkyWithInviteCode } from '../pubky';
import { showToast } from '../helpers';
import { getPubky } from '../../store/selectors/pubkySelectors';
import { getStore } from '../store-helpers';
import { ECurrentScreen } from '../../components/PubkySetup/NewPubkySetup';

type InviteActionData = {
	action: InputAction.Invite;
	params: InviteParams;
};

/**
 * Handles invite action - creates a new pubky and signs up with the invite code
 *
 * @returns The created pubky string on success
 */
export const handleInviteAction = async (
	data: InviteActionData,
	context: ActionContext
): Promise<Result<string>> => {
	const { dispatch } = context;
	const { params } = data;
	const { inviteCode } = params;

	try {
		// Create pubky and sign up with invite code automatically
		const createRes = await createPubkyWithInviteCode(inviteCode, dispatch);

		if (createRes.isErr()) {
			showToast({
				type: 'error',
				title: 'Signup Failed',
				description: createRes.error.message,
			});
			return err(createRes.error.message);
		}

		const { pubky } = createRes.value;

		// Get the pubky data from store
		const pubkyData = getPubky(getStore(), pubky);

		// Show new pubky setup sheet on welcome screen with completed setup
		setTimeout(() => {
			SheetManager.show('new-pubky-setup', {
				payload: {
					pubky,
					data: pubkyData,
					currentScreen: ECurrentScreen.welcome,
					isInvite: true,
				},
				onClose: () => {
					SheetManager.hide('new-pubky-setup');
				},
			});
		}, 150);

		return ok(pubky);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error processing invite';
		console.error('Error handling invite code:', errorMessage);
		showToast({
			type: 'error',
			title: 'Error',
			description: 'Failed to process invite code',
		});
		return err(errorMessage);
	}
};
