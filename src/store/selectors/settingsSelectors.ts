import { createSelector } from '@reduxjs/toolkit';
import { ENavigationAnimation, ETheme } from '../../types/settings.ts';
import { RootState } from '../../types';

const selectSettings = (state: RootState): RootState['settings'] => state.settings;

/**
 * Get the current theme.
 */
export const getTheme = createSelector(
	[selectSettings],
	(settings) => settings?.theme ?? ETheme.system
);

export const getShowOnboarding = createSelector(
	[selectSettings],
	(settings) => settings?.showOnboarding ?? true
);

export const getAutoAuth = createSelector(
	[selectSettings],
	(settings) => settings?.autoAuth ?? false
);

export const getNavigationAnimation = createSelector(
	[selectSettings],
	(settings) => settings?.navigationAnimation ?? ENavigationAnimation.slideFromRight
);

export const getIsOnline = createSelector(
	[selectSettings],
	(settings) => settings?.isOnline ?? true
);

export const getSignedTermsOfUse = createSelector(
	[selectSettings],
	(settings) => settings?.signedTermsOfUse ?? false
);
