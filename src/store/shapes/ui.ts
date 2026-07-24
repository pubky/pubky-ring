export interface LoadingModalState {
	isError: boolean;
	errorMessage: string;
	errorModalTitle?: string;
	errorDescription?: string;
}

export interface UIState {
	loadingModal: LoadingModalState;
}

export const initialLoadingModalState: LoadingModalState = {
	isError: false,
	errorMessage: '',
	errorModalTitle: undefined,
	errorDescription: undefined,
};

export const initialState: UIState = {
	loadingModal: initialLoadingModalState,
};
