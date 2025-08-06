import { showToast } from './helpers';

export const showErrorToast = (description: string, title = 'Error'): void => {
	showToast({ type: 'error', title, description });
};

export const showSuccessToast = (description: string, title = 'Success'): void => {
	showToast({ type: 'success', title, description });
};

export const showInfoToast = (description: string, title = 'Info'): void => {
	showToast({ type: 'info', title, description });
};