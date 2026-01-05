import { RootState } from '../../types';
import { LoadingModalState } from '../shapes/ui.ts';

export const getLoadingModalState = (state: RootState): LoadingModalState => {
	return state.ui.loadingModal;
};
