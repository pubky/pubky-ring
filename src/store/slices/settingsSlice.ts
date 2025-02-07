import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ENavigationAnimation, ETheme } from '../../types/settings.ts';
import { initialState } from '../shapes/settings.ts';

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		updateTheme: (state, action: PayloadAction<{ theme: ETheme }>) => {
			state.theme = action.payload.theme;
		},
		updateShowOnboarding: (state, action: PayloadAction<{ showOnboarding: boolean }>) => {
			state.showOnboarding = action.payload.showOnboarding;
		},
		updateAutoAuth: (state, action: PayloadAction<{ autoAuth: boolean }>) => {
			state.autoAuth = action.payload.autoAuth;
		},
		updateNavigationAnimation: (state, action: PayloadAction<{ navigationAnimation: ENavigationAnimation }>) => {
			state.navigationAnimation = action.payload.navigationAnimation;
		},
		updateIsOnline: (state, action: PayloadAction<{ isOnline: boolean }>) => {
			state.isOnline = action.payload.isOnline;
		},
	},
});

export const {
	updateTheme,
	updateShowOnboarding,
	updateAutoAuth,
	updateNavigationAnimation,
	updateIsOnline,
} = settingsSlice.actions;

export default settingsSlice.reducer;
