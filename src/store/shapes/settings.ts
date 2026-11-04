import { ENavigationAnimation, ETheme, SettingsState } from '../../types/settings.ts';

export const initialState: SettingsState = {
	theme: ETheme.dark,
	showOnboarding: true,
	autoAuth: false,
	requireDeviceAuth: false,
	alwaysShowAuthDetails: false,
	isOnline: true,
	navigationAnimation: ENavigationAnimation.slideFromRight,
	signedTermsOfUse: false,
};
