import { useEffect } from 'react';
import { getPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { getStore } from '../utils/store-helpers.ts';
import { discoverSharedPubkys } from '../utils/sharedPubky.ts';
import { showReuseSharedPubkySheet } from '../utils/sheetHelpers.ts';

let checkedThisSession = false;

export const useSharedPubkyDiscovery = (): void => {
	useEffect(() => {
		if (checkedThisSession) return;
		checkedThisSession = true;

		void (async () => {
			const identities = await discoverSharedPubkys(getPubkyKeys(getStore()));
			if (identities.length > 0) showReuseSharedPubkySheet(identities);
		})();
	}, []);
};
