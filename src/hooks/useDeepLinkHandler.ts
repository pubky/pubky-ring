/**
 * useDeepLinkHandler Hook
 *
 * Handles deeplinks from Redux state using the unified input system.
 * This hook watches the deepLink Redux state and routes parsed inputs to handlers.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllPubkys, getDeepLink, getSignedUpPubkys } from '../store/selectors/pubkySelectors';
import { setDeepLink } from '../store/slices/pubkysSlice';
import { ParsedInput } from '../utils/inputParser';
import { actionRequiresPubky } from '../utils/inputRouter';
import {
	routeInputWithContext,
	showAuthPubkySelection,
	handleNoPubkysAvailable,
} from '../utils/inputHandlerUtils';

/**
 * Hook for handling deeplinks using the unified input system
 *
 */
export const useDeepLinkHandler = (): void => {
	const dispatch = useDispatch();
	const deepLink = useSelector(getDeepLink);
	const signedUpPubkys = useSelector(getSignedUpPubkys);
	const allPubkys = useSelector(getAllPubkys);

	useEffect(() => {
		if (!deepLink) return;

		const processDeepLink = async (): Promise<void> => {
			// Parse the stored deeplink (App.tsx stores ParsedInput as JSON)
			let parsedInput: ParsedInput;
			try {
				parsedInput = JSON.parse(deepLink);
			} catch {
				// If parsing fails, clear the deeplink and exit
				dispatch(setDeepLink(''));
				return;
			}

			// Validate it's a proper ParsedInput object (has action and data properties)
			if (!parsedInput.action || !parsedInput.data) {
				dispatch(setDeepLink(''));
				return;
			}

			// Check if action requires a pubky selection
			if (actionRequiresPubky(parsedInput.action)) {
				const signedUpPubkyKeys = Object.keys(signedUpPubkys);

				if (signedUpPubkyKeys.length === 0) {
					// No signed up pubkys - prompt user to set one up
					dispatch(setDeepLink(''));
					handleNoPubkysAvailable(allPubkys);
					return;
				}

				if (signedUpPubkyKeys.length > 1) {
					showAuthPubkySelection(parsedInput, 'deeplink');
					return;
				}

				// Single pubky - use it directly
				await routeInputWithContext(parsedInput, signedUpPubkyKeys[0], 'deeplink', dispatch);
				return;
			}

			// Action doesn't require pubky selection - route directly
			await routeInputWithContext(parsedInput, undefined, 'deeplink', dispatch);
		};

		processDeepLink();
		// Note: allPubkys is intentionally excluded to prevent re-triggering when new pubkys are created
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deepLink, dispatch, signedUpPubkys]);
};
