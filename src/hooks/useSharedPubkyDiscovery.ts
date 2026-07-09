import { useEffect, useRef } from 'react';
import { getStore } from '../utils/store-helpers';
import { getPubkyKeys } from '../store/selectors/pubkySelectors';
import { discoverSharedIdentities } from '../utils/pubky';
import { showReuseSharedPubkySheet } from '../utils/sheetHelpers';

/**
 * On first mount, checks the shared keychain vault for pubkys created in Bitkit that Ring doesn't yet
 * have, and offers to import them. Runs once per app session; best-effort and never blocks the UI.
 */
export const useSharedPubkyDiscovery = (): void => {
	const hasChecked = useRef(false);

	useEffect(() => {
		if (hasChecked.current) {
			return;
		}
		hasChecked.current = true;

		(async (): Promise<void> => {
			try {
				const known = getPubkyKeys(getStore());
				const identities = await discoverSharedIdentities(known);
				if (identities.length > 0) {
					showReuseSharedPubkySheet({ identities });
				}
			} catch {
				// Discovery is best-effort; failures should never block the home screen.
			}
		})();
	}, []);
};
