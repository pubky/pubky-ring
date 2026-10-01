import type { Result } from '@synonymdev/result';
import type { Dispatch } from 'redux';
import {
	incrementAuthorizedGrantCount,
	loadAuthorizedGrantsFailed,
	loadAuthorizedGrantsStarted,
	loadAuthorizedGrantsSucceeded,
} from '../store/slices/authorizedGrantsSlice.ts';
import { listAuthorizedGrants } from './pubky.ts';
import type { AuthorizedGrants } from './pubky.ts';

let nextRequestId = 0;
type InFlightRequest = {
	promise: Promise<Result<AuthorizedGrants>>;
	token: symbol;
};
const inFlightRequests = new Map<string, InFlightRequest>();
const AUTHORIZATION_RETRY_DELAYS_MS = [0, 250, 750, 1500];

const wait = (delayMs: number): Promise<void> =>
	new Promise(resolve => {
		setTimeout(resolve, delayMs);
	});

const listAuthorizedGrantsOnce = ({
	pubky,
	dispatch,
	forceReload,
}: {
	pubky: string;
	dispatch: Dispatch;
	forceReload: boolean;
}): Promise<Result<AuthorizedGrants>> => {
	const inFlightRequest = inFlightRequests.get(pubky)?.promise;
	if (inFlightRequest && !forceReload) {
		return inFlightRequest;
	}

	const requestToken = Symbol(pubky);
	const request = (async (): Promise<Result<AuthorizedGrants>> => {
		if (inFlightRequest) {
			try {
				await inFlightRequest;
			} catch {
				// A mutation still needs a fresh request after an unexpected earlier failure.
			}
		}

		try {
			return await listAuthorizedGrants({ pubky, dispatch });
		} finally {
			if (inFlightRequests.get(pubky)?.token === requestToken) {
				inFlightRequests.delete(pubky);
			}
		}
	})();
	inFlightRequests.set(pubky, { promise: request, token: requestToken });
	return request;
};

export const refreshAuthorizedGrants = async ({
	pubky,
	dispatch,
	forceReload = false,
	minimumCount,
}: {
	pubky: string;
	dispatch: Dispatch;
	forceReload?: boolean;
	minimumCount?: number;
}): Promise<Result<AuthorizedGrants>> => {
	nextRequestId += 1;
	const requestId = nextRequestId;
	dispatch(loadAuthorizedGrantsStarted({ pubky, requestId }));

	const result = await listAuthorizedGrantsOnce({ pubky, dispatch, forceReload });
	if (result.isErr()) {
		dispatch(
			loadAuthorizedGrantsFailed({
				pubky,
				requestId,
				error: result.error.message,
			}),
		);
		return result;
	}
	if (minimumCount !== undefined && result.value.grants.length < minimumCount) {
		return result;
	}

	dispatch(
		loadAuthorizedGrantsSucceeded({
			pubky,
			requestId,
			grants: result.value.grants,
			sessionId: result.value.sessionId,
		}),
	);
	return result;
};

export const refreshAuthorizedGrantsAfterAuthorization = async ({
	pubky,
	dispatch,
	currentCount,
}: {
	pubky: string;
	dispatch: Dispatch;
	currentCount: number;
}): Promise<Result<AuthorizedGrants>> => {
	const expectedCount = currentCount + 1;
	dispatch(incrementAuthorizedGrantCount({ pubky }));

	let latestResult: Result<AuthorizedGrants> | undefined;
	for (const [index, delayMs] of AUTHORIZATION_RETRY_DELAYS_MS.entries()) {
		if (delayMs > 0) {
			await wait(delayMs);
		}

		const isFinalAttempt = index === AUTHORIZATION_RETRY_DELAYS_MS.length - 1;
		latestResult = await refreshAuthorizedGrants({
			pubky,
			dispatch,
			forceReload: true,
			minimumCount: isFinalAttempt ? undefined : expectedCount,
		});
		if (latestResult.isErr() || latestResult.value.grants.length >= expectedCount) {
			return latestResult;
		}
	}

	return latestResult!;
};
