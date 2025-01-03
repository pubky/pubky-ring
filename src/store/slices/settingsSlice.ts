import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ETheme, SettingsState } from '../../types/settings.ts';

const initialState: SettingsState = {
	theme: ETheme.system,
	showOnboarding: true,
	autoAuth: false,
};

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
	},
});

export const {
	updateTheme,
	updateShowOnboarding,
	updateAutoAuth,
} = settingsSlice.actions;

export default settingsSlice.reducer;
