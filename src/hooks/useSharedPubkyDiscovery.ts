import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useDispatch } from 'react-redux';
import { showToast } from '@synonymdev/react-native-toast';
import { getBorrowedPubkyKeys, getOwnedPubkyKeys, getPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import {
	disconnectBorrowedPubky,
	getProfileAvatar,
	getProfileInfo,
	reconcileOwnedSharedPubkys,
} from '../utils/pubky.ts';
import { getStore } from '../utils/store-helpers.ts';
import { discoverSharedPubkys, SharedPubkyDiscovery, SharedPubkyIdentity } from '../utils/sharedPubky.ts';
import i18n from '../i18n';
import { removeDisconnectedPubkyDetail } from '../sheets/sheetNavigation.tsx';

export interface SharedPubkyDiscoveryState extends SharedPubkyDiscovery {
	refresh: () => Promise<void>;
}

const noOpRefresh = async (): Promise<void> => {};

/**
 * A card vanishing from Home with no explanation looks like data loss, so the automatic
 * disconnect says why. One toast per refresh, however many identities the source app dropped.
 */
const notifyAutoDisconnected = (disconnectedCount: number): void => {
	if (disconnectedCount === 0) return;
	showToast({
		type: 'info',
		title: i18n.t('reuseSharedPubky.noLongerSharedTitle'),
		description: i18n.t('reuseSharedPubky.noLongerShared'),
		durationMs: 5000,
	});
};

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
	const refreshQueued = useRef(false);

	const runRefresh = useCallback(async (): Promise<void> => {
		// Best-effort migration/reconciliation. Failure (including a missing iOS entitlement) never
		// mutates Ring's canonical private keychain.
		await reconcileOwnedSharedPubkys();

		const state = getStore();
		const owned = getOwnedPubkyKeys(state);
		const discovery = await discoverSharedPubkys(owned);
		setAvailable(discovery.available);
		// Only the calls that actually removed something are counted: another flow may have
		// disconnected the same identity first and already explained it.
		let disconnectedCount = 0;
		if (!discovery.available) {
			setIdentities([]);
			// Fail closed: a borrowed profile cannot remain active when its source can no longer
			// supply the credential. Ring-owned private identities are never affected.
			for (const borrowedPubky of getBorrowedPubkyKeys(getStore())) {
				if (await disconnectBorrowedPubky(borrowedPubky, dispatch)) {
					disconnectedCount += 1;
					removeDisconnectedPubkyDetail(borrowedPubky);
				}
			}
			notifyAutoDisconnected(disconnectedCount);
			return;
		}

		const discoveredKeys = new Set(discovery.identities.map(identity => identity.pubky));
		for (const borrowedPubky of getBorrowedPubkyKeys(getStore())) {
			if (!discoveredKeys.has(borrowedPubky)) {
				// The source app/item disappeared. Clear only Ring's reference and local session.
				if (await disconnectBorrowedPubky(borrowedPubky, dispatch)) {
					disconnectedCount += 1;
					removeDisconnectedPubkyDetail(borrowedPubky);
				}
			}
		}
		notifyAutoDisconnected(disconnectedCount);

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
		if (refreshInFlight.current) {
			refreshQueued.current = true;
			return refreshInFlight.current;
		}

		const task = (async (): Promise<void> => {
			try {
				let lastRefreshFailed = false;
				let lastRefreshError: unknown;
				do {
					refreshQueued.current = false;
					lastRefreshFailed = false;
					try {
						await runRefresh();
					} catch (error) {
						lastRefreshFailed = true;
						lastRefreshError = error;
					}
				} while (refreshQueued.current);
				if (lastRefreshFailed) throw lastRefreshError;
			} finally {
				refreshInFlight.current = null;
			}
		})();
		refreshInFlight.current = task;
		return task;
	}, [runRefresh]);

	useEffect(() => {
		refresh().catch(error => console.warn('Failed to refresh shared pubkys:', error));
		const subscription = AppState.addEventListener('change', nextState => {
			if (nextState === 'active') {
				refresh().catch(error => console.warn('Failed to refresh shared pubkys:', error));
			}
		});
		return () => subscription.remove();
	}, [refresh]);

	return { available, identities, refresh };
};
