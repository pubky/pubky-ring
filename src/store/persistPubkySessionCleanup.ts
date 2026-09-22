import type { Dispatch } from 'redux';
import { persistor, store } from './index';
import { reduxStorage } from './mmkv-storage';
import { refreshPubkySessionCleanup } from './slices/pubkysSlice';

/** Redux-persist swallows asynchronous write failures, so flush alone is not durable proof. */
export const persistPubkySessionCleanup = async (dispatch: Dispatch): Promise<boolean> => {
	try {
		dispatch(refreshPubkySessionCleanup());
		const expected = JSON.stringify(store.getState().pubky.pendingSessionCleanup ?? {});
		await persistor.flush();
		const root = await reduxStorage.getItem('persist:root');
		if (!root) return false;
		const pubkyState = JSON.parse(JSON.parse(root).pubky);
		return JSON.stringify(pubkyState.pendingSessionCleanup) === expected;
	} catch {
		return false;
	}
};
