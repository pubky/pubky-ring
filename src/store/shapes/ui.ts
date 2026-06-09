import { Dispatch } from 'redux';

export interface LoadingModalState {
	isError: boolean;
	errorMessage: string;
	errorModalTitle?: string;
	errorDescription?: string;
	onTryAgain: (() => void) | null;
}

export interface UIState {
	loadingModal: LoadingModalState;
}

export const initialLoadingModalState: LoadingModalState = {
	isError: false,
	errorMessage: '',
	errorModalTitle: undefined,
	errorDescription: undefined,
	onTryAgain: null,
};

export const initialState: UIState = {
	loadingModal: initialLoadingModalState,
};

// Store the dispatch reference for use in onTryAgain callbacks
let storedDispatch: Dispatch | null = null;

export const setStoredDispatch = (dispatch: Dispatch): void => {
	storedDispatch = dispatch;
};

export const getStoredDispatch = (): Dispatch | null => {
	return storedDispatch;
};
