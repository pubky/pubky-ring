import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from '../shapes/ui.ts';

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setLoadingModalError: (state, action: PayloadAction<{
			isError: boolean;
			errorMessage?: string;
		}>) => {
			state.loadingModal.isError = action.payload.isError;
			state.loadingModal.errorMessage = action.payload.errorMessage ?? '';
		},
		resetLoadingModal: (state) => {
			state.loadingModal.isError = false;
			state.loadingModal.errorMessage = '';
		},
	},
});

export const {
	setLoadingModalError,
	resetLoadingModal,
} = uiSlice.actions;

export default uiSlice.reducer;
