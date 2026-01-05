/**
 * Invite Action Handler
 *
 * Handles invite codes that create a new pubky and sign up to a homeserver.
 * This is simpler than the signup flow - no auth step is performed.
 */

import { Result, ok, err } from '@synonymdev/result';
import { SheetManager } from 'react-native-actions-sheet';
import { InputAction, InviteParams, parseInput } from '../inputParser';
import { ActionContext, routeInput } from '../inputRouter';
import { createPubkyWithInviteCode } from '../pubky';
import { getErrorMessage } from '../errorHandler';
import { getPubky } from '../../store/selectors/pubkySelectors';
import { getStore } from '../store-helpers';
import { ECurrentScreen } from '../../components/PubkySetup/NewPubkySetup';
import { readFromClipboard } from '../clipboard';
import { setLoadingModalError } from '../../store/slices/uiSlice';
import { setStoredDispatch } from '../../store/shapes/ui';
import i18n from '../../i18n';
import { Dispatch } from 'redux';

type InviteActionData = {
	action: InputAction.Invite;
	params: InviteParams;
};

/**
 * Opens the camera modal for scanning invite codes
 * Used for "Try again" functionality after an error
 * Exported for use by LoadingModal
 */
export const openCameraForRetry = (dispatch: Dispatch): void => {
	SheetManager.show('camera', {
		payload: {
			title: i18n.t('import.title'),
			onScan: async (data: string) => {
				await SheetManager.hide('camera');
				const parsed = await parseInput(data, 'scan');
				await routeInput(parsed, { dispatch });
			},
			onCopyClipboard: async () => {
				await SheetManager.hide('camera');
				const clipboardContent = await readFromClipboard();
				if (clipboardContent) {
					const parsed = await parseInput(clipboardContent, 'clipboard');
					await routeInput(parsed, { dispatch });
				}
			},
			onClose: () => SheetManager.hide('camera'),
		},
	});
};

/**
 * Transitions the loading modal to error state via Redux
 */
const showErrorState = (errorMessage: string, dispatch: Dispatch): void => {
	// Store dispatch for use in "Try again" button
	setStoredDispatch(dispatch);
	// Update Redux state to show error
	dispatch(setLoadingModalError({
		isError: true,
		errorMessage: errorMessage,
	}));
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

	// Show loading modal (don't await - it resolves when sheet closes)
	SheetManager.show('loading', {
		payload: {
			modalTitle: i18n.t('loading.modalTitle'),
		},
	});

	try {
		// Create pubky and sign up with invite code automatically
		const createRes = await createPubkyWithInviteCode(inviteCode, dispatch);

		if (createRes.isErr()) {
			const errorMessage = getErrorMessage(createRes.error, i18n.t('errors.failedToCreatePubkyWithInvite'));
			showErrorState(errorMessage, dispatch);
			return err(errorMessage);
		}

		const { pubky } = createRes.value;

		// Get the pubky data from store
		const pubkyData = getPubky(getStore(), pubky);

		// Hide loading modal before showing setup sheet
		await SheetManager.hide('loading');

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
		const errorMessage = error instanceof Error ? error.message : i18n.t('invite.unknownErrorProcessing');
		console.error('Error handling invite code:', errorMessage);
		showErrorState(i18n.t('errors.inviteProcessingFailed'), dispatch);
		return err(errorMessage);
	}
};
