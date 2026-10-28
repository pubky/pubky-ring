import { createSelector } from '@reduxjs/toolkit';
import { ENavigationAnimation, ETheme } from '../../types/settings.ts';
import { RootState } from '../../types';

const selectSettings = (state: RootState): RootState['settings'] => state.settings;

/**
 * Get the current theme.
 */
export const getTheme = createSelector([selectSettings], settings => settings?.theme ?? ETheme.system);

export const getShowOnboarding = createSelector(
	[selectSettings],
	settings => settings?.showOnboarding ?? true,
);

// Ignore persisted Auto Auth settings in release builds, not just the hidden toggle.
export const getAutoAuth = createSelector(
	[selectSettings],
	settings => __DEV__ && (settings?.autoAuth ?? false),
);

// Ignore persisted developer-only animation preferences in release builds.
export const getNavigationAnimation = createSelector([selectSettings], settings =>
	__DEV__
		? (settings?.navigationAnimation ?? ENavigationAnimation.slideFromRight)
		: ENavigationAnimation.slideFromRight,
);

export const getIsOnline = createSelector([selectSettings], settings => settings?.isOnline ?? true);

export const getSignedTermsOfUse = createSelector(
	[selectSettings],
	settings => settings?.signedTermsOfUse ?? false,
);
