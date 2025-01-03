import { store } from '../store';
import { getAutoAuth } from '../store/selectors/settingsSelectors';
import { RootState } from '../types';
import { getPubky, isPubkySignedUp } from '../store/selectors/pubkySelectors.ts';
import { Pubky } from '../types/pubky.ts';

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
