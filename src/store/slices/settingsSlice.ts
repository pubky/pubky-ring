import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ETheme, SettingsState } from '../../types/settings.ts';

const initialState: SettingsState = {
	theme: ETheme.system,
	showOnboarding: true,
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
	},
});

export const {
	updateTheme,
	updateShowOnboarding,
} = settingsSlice.actions;

export default settingsSlice.reducer;
