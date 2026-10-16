import { store } from '../store';
import { getAutoAuth } from '../store/selectors/settingsSelectors';
import { RootState } from '../types';
import {
	getAllPubkys,
	getPubky,
	isPubkySignedUp,
	getSignedUpPubkys,
	getPubkyKeyBySignupToken,
	canManagePubkyGrants,
} from '../store/selectors/pubkySelectors.ts';
import { EBackupPreference, Pubky, TPubkys } from '../types/pubky.ts';
import { getAuthorizedGrantCount } from '../store/selectors/authorizedGrantsSelectors.ts';

export const getStore = (): RootState => store.getState();

export const getAutoAuthFromStore = (): boolean => {
	return getAutoAuth(getStore()) ?? false;
};

export const getAuthorizedGrantCountFromStore = (pubky: string): number => {
	return getAuthorizedGrantCount(getStore(), pubky);
};

export const canManagePubkyGrantsFromStore = (pubky: string): boolean => {
	const pubkyData = getPubkyDataFromStore(pubky);
	return Boolean(pubkyData && canManagePubkyGrants(pubkyData));
};

export const getAllPubkysFromStore = (): TPubkys => {
	return getAllPubkys(getStore());
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

export const getPubkyKeyBySignupTokenFromStore = (signupToken: string): string | null => {
	return getPubkyKeyBySignupToken(getStore(), signupToken);
};
