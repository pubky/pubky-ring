import { store } from '../store';
import { getAutoAuth } from '../store/selectors/settingsSelectors';
import { RootState } from '../types';
import { getPubky, isPubkySignedUp, getSignedUpPubkys } from '../store/selectors/pubkySelectors.ts';
import { EBackupPreference, Pubky } from '../types/pubky.ts';

export const getStore = (): RootState => store.getState();

export const getAutoAuthFromStore = (): boolean => {
	return getAutoAuth(getStore()) ?? false;
};

export const getPubkyDataFromStore = (pubky: string): Pubky => {
	return getPubky(getStore(), pubky);
};

export const getIsPubkySignedUpFromStore = (pubky: string): boolean => {
	return isPubkySignedUp(getStore(), pubky);
};

export const getIsOnline = (): boolean => {
	return getStore().settings.isOnline ?? true;
};

export const getBackupPreference = (pubky: string): EBackupPreference => {
	return getStore().pubky.pubkys[pubky]?.backupPreference ?? EBackupPreference.encryptedFile;
};

export const getSignedUpPubkysFromStore = (): { [key: string]: Pubky } => {
	return getSignedUpPubkys(getStore());
};
