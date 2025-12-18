import { showToast } from './helpers';
import { Result, ok, err } from '@synonymdev/result';
import i18n from '../i18n';

/**
 * Checks if a string is a valid, useful error message
 */
const isValidErrorMessage = (msg: string | undefined | null): boolean => {
	if (!msg) return false;
	const trimmed = msg.trim();
	if (trimmed.length === 0) return false;
	// Remove all whitespace and check for empty objects/arrays
	const noWhitespace = trimmed.replace(/\s/g, '');
	if (noWhitespace === '{}' || noWhitespace === '[]') return false;
	return true;
};

/**
 * Safely extracts an error message from any error type.
 * Handles strings, Error objects, objects with message property, and unknown types.
 * Recursively checks nested error structures.
 */
export const getErrorMessage = (error: unknown, fallback = i18n.t('errors.unknownError')): string => {
	// Handle null/undefined
	if (error === null || error === undefined) {
		return fallback;
	}

	// Handle strings
	if (typeof error === 'string') {
		return isValidErrorMessage(error) ? error : fallback;
	}

	// Handle Error instances
	if (error instanceof Error) {
		return isValidErrorMessage(error.message) ? error.message : fallback;
	}

	// Handle objects
	if (typeof error === 'object') {
		const errorObj = error as Record<string, unknown>;

		// Check for 'message' property (could be string or nested object)
		if ('message' in errorObj) {
			const msg = errorObj.message;
			if (typeof msg === 'string') {
				return isValidErrorMessage(msg) ? msg : fallback;
			}
			// Recursively check if message is an object
			if (msg && typeof msg === 'object') {
				return getErrorMessage(msg, fallback);
			}
		}

		// Check for 'error' property (nested error structure)
		if ('error' in errorObj) {
			const nestedError = errorObj.error;
			if (typeof nestedError === 'string') {
				return isValidErrorMessage(nestedError) ? nestedError : fallback;
			}
			if (nestedError && typeof nestedError === 'object') {
				return getErrorMessage(nestedError, fallback);
			}
		}

		// Try to stringify the object for debugging
		try {
			const str = JSON.stringify(error);
			return isValidErrorMessage(str) ? str : fallback;
		} catch {
			return fallback;
		}
	}

	return fallback;
};

export class AppError extends Error {
	constructor(
		message: string,
		public code: string,
		public recoverable = true,
	) {
		super(message);
		this.name = 'AppError';
	}
}

export const handleError = (error: unknown, context: string): boolean => {
	console.error(`Error in ${context}:`, error);

	if (error instanceof AppError) {
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: error.message,
		});
		return error.recoverable;
	}

	showToast({
		type: 'error',
		title: i18n.t('common.error'),
		description: i18n.t('pubkyErrors.unexpectedError'),
	});
	return false;
};

export const withErrorHandler = async <T>(
	operation: () => Promise<T>,
	context: string,
): Promise<Result<T>> => {
	try {
		const result = await operation();
		return ok(result);
	} catch (error) {
		handleError(error, context);
		return err(error instanceof Error ? error.message : i18n.t('errors.unknownError'));
	}
};