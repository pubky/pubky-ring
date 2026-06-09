import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from '../shapes/ui.ts';

const uiSlice = createSlice({
	name: 'ui',
	initialState,
	reducers: {
		setLoadingModalError: (
			state,
			action: PayloadAction<{
				isError: boolean;
				errorMessage?: string;
				errorModalTitle?: string;
				errorDescription?: string;
			}>,
		) => {
			state.loadingModal.isError = action.payload.isError;
			state.loadingModal.errorMessage = action.payload.errorMessage ?? '';
			state.loadingModal.errorModalTitle = action.payload.errorModalTitle;
			state.loadingModal.errorDescription = action.payload.errorDescription;
		},
		resetLoadingModal: state => {
			state.loadingModal.isError = false;
			state.loadingModal.errorMessage = '';
			state.loadingModal.errorModalTitle = undefined;
			state.loadingModal.errorDescription = undefined;
		},
	},
});

export const { setLoadingModalError, resetLoadingModal } = uiSlice.actions;

export default uiSlice.reducer;
