import { showToast } from './helpers';
import { Result, ok, err } from '@synonymdev/result';

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
			title: 'Error',
			description: error.message,
		});
		return error.recoverable;
	}

	showToast({
		type: 'error',
		title: 'Error',
		description: 'An unexpected error occurred',
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
		return err(error instanceof Error ? error.message : 'Unknown error');
	}
};