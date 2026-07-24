import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useDispatch } from 'react-redux';
import { getBorrowedPubkyKeys, getOwnedPubkyKeys, getPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { removePubky } from '../store/slices/pubkysSlice.ts';
import { getProfileAvatar, getProfileInfo, reconcileOwnedSharedPubkys } from '../utils/pubky.ts';
import { getStore } from '../utils/store-helpers.ts';
import { discoverSharedPubkys, SharedPubkyDiscovery, SharedPubkyIdentity } from '../utils/sharedPubky.ts';

export interface SharedPubkyDiscoveryState extends SharedPubkyDiscovery {
	refresh: () => Promise<void>;
}

const noOpRefresh = async (): Promise<void> => {};
export const SharedPubkyDiscoveryContext = createContext<SharedPubkyDiscoveryState>({
	available: false,
	identities: [],
	refresh: noOpRefresh,
});

export const useSharedPubkyDiscovery = (): SharedPubkyDiscoveryState => {
	const dispatch = useDispatch();
	const [available, setAvailable] = useState(false);
	const [identities, setIdentities] = useState<SharedPubkyIdentity[]>([]);
	const refreshInFlight = useRef<Promise<void> | null>(null);

	const runRefresh = useCallback(async (): Promise<void> => {
		// Best-effort migration/reconciliation. Failure (including a missing iOS entitlement) never
		// mutates Ring's canonical private keychain.
		await reconcileOwnedSharedPubkys();

		const state = getStore();
		const owned = getOwnedPubkyKeys(state);
		const discovery = await discoverSharedPubkys(owned);
		setAvailable(discovery.available);
		if (!discovery.available) {
			setIdentities([]);
			// Fail closed: a borrowed profile cannot remain active when its source can no longer
			// supply the credential. Ring-owned private identities are never affected.
			for (const borrowedPubky of getBorrowedPubkyKeys(getStore())) {
				dispatch(removePubky(borrowedPubky));
			}
			return;
		}

		const discoveredKeys = new Set(discovery.identities.map(identity => identity.pubky));
		for (const borrowedPubky of getBorrowedPubkyKeys(getStore())) {
			if (!discoveredKeys.has(borrowedPubky)) {
				// The source app/item disappeared. Clear only Ring's reference and local session.
				dispatch(removePubky(borrowedPubky));
			}
		}

		const existing = new Set(getPubkyKeys(getStore()));
		const candidates = discovery.identities.filter(identity => !existing.has(identity.pubky));
		const resolved = await Promise.all(
			candidates.map(async identity => {
				const [profile, avatar] = await Promise.all([
					getProfileInfo(identity.pubky),
					getProfileAvatar(identity.pubky),
				]);
				return {
					...identity,
					...(profile.isOk() && profile.value.name ? { name: profile.value.name } : {}),
					...(avatar.isOk() ? { image: avatar.value } : {}),
				};
			}),
		);
		setIdentities(resolved);
	}, [dispatch]);

	const refresh = useCallback((): Promise<void> => {
		if (refreshInFlight.current) return refreshInFlight.current;

		const task = runRefresh().finally(() => {
			if (refreshInFlight.current === task) refreshInFlight.current = null;
		});
		refreshInFlight.current = task;
		return task;
	}, [runRefresh]);

	useEffect(() => {
		void refresh();
		const subscription = AppState.addEventListener('change', nextState => {
			if (nextState === 'active') void refresh();
		});
		return () => subscription.remove();
	}, [refresh]);

	return { available, identities, refresh };
};
