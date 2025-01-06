import { ENavigationAnimation, ETheme } from '../../types/settings.ts';
import { RootState } from '../../types';

/**
 * Get the current theme.
 */
export const getTheme = (state: RootState): ETheme => {
	return state?.settings?.theme ?? ETheme.system;
};

export const getShowOnboarding = (state: RootState): boolean => {
	return state?.settings?.showOnboarding ?? true;
};

export const getAutoAuth = (state: RootState): boolean => {
	return state?.settings?.autoAuth ?? false;
};

export const getNavigationAnimation = (state: RootState): ENavigationAnimation => {
	return state?.settings?.navigationAnimation ?? ENavigationAnimation.slideFromRight;
};
