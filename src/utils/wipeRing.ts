import { Dispatch } from 'redux';
import { resetSettings } from '../store/slices/settingsSlice';
import { resetPubkys } from '../store/slices/pubkysSlice';
import { wipeKeychain } from './keychain';

/**
 * Wipes device keychain first, then Redux. Callers must await this before
 * navigating away (H7).
 */
export const wipeRingCustody = async (dispatch: Dispatch): Promise<void> => {
	await wipeKeychain();
	dispatch(resetSettings());
	dispatch(resetPubkys());
};
