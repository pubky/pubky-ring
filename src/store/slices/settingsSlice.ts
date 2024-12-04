import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ETheme, SettingsState } from '../../types/settings.ts';

const initialState: SettingsState = {
	settings: {
		theme: ETheme.system,
	},
};

const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		updateTheme: (state, action: PayloadAction<{ theme: ETheme }>) => {
			state.settings.theme = action.payload.theme;
		},
	},
});

export const {
	updateTheme,
} = settingsSlice.actions;

export default settingsSlice.reducer;
