/**
 * Input Router
 *
 * This module routes parsed input to the appropriate action handler.
 * It serves as the single dispatcher for all input actions, ensuring
 * consistent handling regardless of the input source.
 */

import { Dispatch } from 'redux';
import { Result, ok, err } from '@synonymdev/result';
import {
	ParsedInput,
	InputAction,
	isAuthAction,
	isImportAction,
	isSignupAction,
	isInviteAction,
	isSessionAction,
	isUnknownAction,
} from './inputParser';
import { handleAuthAction } from './actions/authAction';
import { handleImportAction } from './actions/importAction';
import { handleSignupAction } from './actions/signupAction';
import { handleInviteAction } from './actions/inviteAction';
import { handleSessionAction } from './actions/sessionAction';
import i18n from '../i18n';

// Context passed to action handlers
export interface ActionContext {
	dispatch: Dispatch;
	// Optional pubky for auth actions (required when authorizing)
	pubky?: string;
	// Whether this is from a deeplink (affects post-action behavior)
	isDeeplink?: boolean;
	// Skip showing the import success sheet (for direct import flows)
	skipImportSheet?: boolean;
}

// Result from routing
export interface RouteResult {
	success: boolean;
	action: InputAction;
	message?: string;
	pubky?: string;
}

/**
 * Routes a parsed input to the appropriate action handler
 *
 * @param parsed - The parsed input from parseInput()
 * @param context - Context for the action (dispatch, pubky, etc.)
 * @returns Result with routing outcome
 */
export const routeInput = async (
	parsed: ParsedInput,
	context: ActionContext
): Promise<Result<RouteResult>> => {
	const { data, source } = parsed;

	// Set isDeeplink based on source if not explicitly provided
	const effectiveContext: ActionContext = {
		...context,
		isDeeplink: context.isDeeplink ?? source === 'deeplink',
	};

	try {
		// Route to appropriate handler based on action type
		if (isAuthAction(data)) {
			const result = await handleAuthAction(data, effectiveContext);
			return result.isOk()
				? ok({ success: true, action: InputAction.Auth, message: result.value })
				: err(result.error.message);
		}

		if (isImportAction(data)) {
			const result = await handleImportAction(data, effectiveContext);
			return result.isOk()
				? ok({ success: true, action: InputAction.Import, pubky: result.value, message: i18n.t('router.importSuccessful') })
				: err(result.error.message);
		}

		if (isSignupAction(data)) {
			const result = await handleSignupAction(data, effectiveContext);
			return result.isOk()
				? ok({ success: true, action: InputAction.Signup, pubky: result.value, message: i18n.t('router.signupSuccessful') })
				: err(result.error.message);
		}

		if (isInviteAction(data)) {
			const result = await handleInviteAction(data, effectiveContext);
			return result.isOk()
				? ok({ success: true, action: InputAction.Invite, pubky: result.value, message: i18n.t('router.inviteProcessed') })
				: err(result.error.message);
		}

		if (isSessionAction(data)) {
			const result = await handleSessionAction(data, effectiveContext);
			return result.isOk()
				? ok({ success: true, action: InputAction.Session, pubky: result.value, message: i18n.t('router.sessionReturned') })
				: err(result.error.message);
		}

		if (isUnknownAction(data)) {
			console.log('[InputRouter] Unknown input format:', data.params.rawData.substring(0, 100));
			return err(i18n.t('errors.unrecognizedFormat'));
		}

		return err(i18n.t('router.unhandledInputType'));
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : i18n.t('router.unknownRoutingError');
		console.error('Error routing input:', errorMessage);
		return err(errorMessage);
	}
};

/**
 * Determines if an action requires a pubky to be selected
 */
export const actionRequiresPubky = (action: InputAction): boolean => {
	return action === InputAction.Auth || action === InputAction.Session;
};

/**
 * Determines if an action can proceed without network
 */
export const actionRequiresNetwork = (action: InputAction): boolean => {
	return [
		InputAction.Auth,
		InputAction.Signup,
		InputAction.Invite,
		InputAction.Session,
	].includes(action);
};
