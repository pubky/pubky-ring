import {
	ENavigationAnimation,
	ETheme,
	SettingsState,
} from '../../types/settings.ts';

export const initialState: SettingsState = {
	theme: ETheme.system,
	showOnboarding: true,
	autoAuth: false,
	navigationAnimation: ENavigationAnimation.slideFromRight,
};
