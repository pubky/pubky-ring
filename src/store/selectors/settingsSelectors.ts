import { ETheme, SettingsState } from '../../types/settings.ts';

/**
 * Get the current theme.
 */
export const getTheme = (state: SettingsState): ETheme => {
	return state?.settings?.theme ?? ETheme.system;
};
