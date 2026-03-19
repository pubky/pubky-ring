import { Linking } from 'react-native';
import { XCallbackParams } from './inputParser';

/**
 * Safely opens a URL via Linking, catching errors from unregistered schemes.
 */
const safeOpenURL = async (url: string): Promise<void> => {
	try {
		await Linking.openURL(url);
	} catch (e) {
		console.warn('Failed to open x-callback URL:', url, e);
	}
};

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
		await safeOpenURL(xCallback.xSuccess);
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
		await safeOpenURL(url);
	}
};

/**
 * Opens the x-success URL with additional data appended as query params.
 * Used by flows that need to pass data back (e.g., session returns session_secret).
 */
export const openXSuccessWithParams = async (
	xCallback: XCallbackParams | undefined,
	params: Record<string, string>,
): Promise<void> => {
	if (xCallback?.xSuccess) {
		const url = appendParams(xCallback.xSuccess, params);
		await safeOpenURL(url);
	}
};

/**
 * Opens the x-cancel URL if provided.
 */
export const openXCancel = async (xCallback?: XCallbackParams): Promise<void> => {
	if (xCallback?.xCancel) {
		await safeOpenURL(xCallback.xCancel);
	}
};
