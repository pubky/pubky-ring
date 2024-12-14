import {ETheme} from '../../types/settings.ts';
import {RootState} from '../../types';

/**
 * Get the current theme.
 */
export const getTheme = (state: RootState): ETheme => {
	return state?.settings?.theme ?? ETheme.system;
};

export const getShowOnboarding = (state: RootState): boolean => {
	return state?.settings?.showOnboarding ?? true;
};
