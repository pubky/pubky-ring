/**
 * useDeepLinkHandler Hook
 *
 * Handles deeplinks from Redux state using the unified input system.
 * This hook watches the deepLink Redux state and routes parsed inputs to handlers.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	getAllPubkys,
	getDeepLink,
	getDeepLinkQueue,
	getSignedUpPubkys,
} from '../store/selectors/pubkySelectors';
import { queueDeepLink, removeDeepLinkFromQueue, setDeepLink } from '../store/slices/pubkysSlice';
import { isSheetNavigationResetError, waitForPendingSheetNavigation } from '../sheets/sheetNavigation.tsx';
import { ParsedInput } from '../utils/inputParser';
import { actionRequiresPubky } from '../utils/inputRouter';
import {
	routeInputWithContext,
	showAuthPubkySelection,
	handleNoPubkysAvailable,
} from '../utils/inputHandlerUtils';

const scheduledDeepLinks = new Set<string>();

/**
 * Hook for handling deeplinks using the unified input system
 *
 */
export const useDeepLinkHandler = (): void => {
	const dispatch = useDispatch();
	const legacyDeepLink = useSelector(getDeepLink);
	const deepLinkQueue = useSelector(getDeepLinkQueue);
	const signedUpPubkys = useSelector(getSignedUpPubkys);
	const allPubkys = useSelector(getAllPubkys);

	useEffect(() => {
		if (!legacyDeepLink) return;
		dispatch(queueDeepLink(legacyDeepLink));
		dispatch(setDeepLink(''));
	}, [dispatch, legacyDeepLink]);

	useEffect(() => {
		const nextDeepLink = deepLinkQueue[0];
		if (!nextDeepLink || scheduledDeepLinks.has(nextDeepLink.id)) return;
		scheduledDeepLinks.add(nextDeepLink.id);

		const processDeepLink = async (): Promise<void> => {
			await waitForPendingSheetNavigation();

			// Parse the stored deeplink (App.tsx stores ParsedInput as JSON)
			let parsedInput: ParsedInput;
			try {
				parsedInput = JSON.parse(nextDeepLink.deepLink);
			} catch {
				return;
			}

			// Validate it's a proper ParsedInput object (has action and data properties)
			if (!parsedInput.action || !parsedInput.data) {
				return;
			}

			// Check if action requires a pubky selection
			if (actionRequiresPubky(parsedInput.action)) {
				const signedUpPubkyKeys = Object.keys(signedUpPubkys);

				if (signedUpPubkyKeys.length === 0) {
					// No signed up pubkys - prompt user to set one up
					handleNoPubkysAvailable(allPubkys);
					return;
				}

				if (signedUpPubkyKeys.length > 1) {
					await showAuthPubkySelection(parsedInput, 'deeplink');
					return;
				}

				// Single pubky - use it directly
				await routeInputWithContext(parsedInput, signedUpPubkyKeys[0], 'deeplink', dispatch);
				return;
			}

			// Action doesn't require pubky selection - route directly
			await routeInputWithContext(parsedInput, undefined, 'deeplink', dispatch);
		};

		processDeepLink()
			.catch(error => {
				if (isSheetNavigationResetError(error)) return;
				console.error('Error processing deep link');
			})
			.finally(() => {
				scheduledDeepLinks.delete(nextDeepLink.id);
				dispatch(removeDeepLinkFromQueue(nextDeepLink.id));
			});
		// Note: allPubkys is intentionally excluded to prevent re-triggering when new pubkys are created
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deepLinkQueue, dispatch, signedUpPubkys]);
};
