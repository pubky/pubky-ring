import { Linking } from 'react-native';
import { XCallbackParams } from './inputParser';

/**
 * Appends query parameters to a URL, respecting existing query strings.
 */
const appendParams = (baseUrl: string, params: Record<string, string>): string => {
	const separator = baseUrl.includes('?') ? '&' : '?';
	const queryParams = new URLSearchParams(params).toString();
	return `${baseUrl}${separator}${queryParams}`;
};

/**
 * Opens the x-success URL if provided.
 */
export const openXSuccess = async (xCallback?: XCallbackParams): Promise<void> => {
	if (xCallback?.xSuccess) {
		await Linking.openURL(xCallback.xSuccess);
	}
};

/**
 * Opens the x-error URL with errorCode and errorMessage appended as query params.
 */
export const openXError = async (
	xCallback: XCallbackParams | undefined,
	errorCode: string,
	errorMessage: string,
): Promise<void> => {
	if (xCallback?.xError) {
		const url = appendParams(xCallback.xError, {
			errorCode,
			errorMessage,
		});
		await Linking.openURL(url);
	}
};

/**
 * Opens the x-cancel URL if provided.
 */
export const openXCancel = async (xCallback?: XCallbackParams): Promise<void> => {
	if (xCallback?.xCancel) {
		await Linking.openURL(xCallback.xCancel);
	}
};
