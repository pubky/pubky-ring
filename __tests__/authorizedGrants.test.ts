import { err, ok } from '@synonymdev/result';
import {
	refreshAuthorizedGrants,
	refreshAuthorizedGrantsAfterAuthorization,
} from '../src/utils/authorizedGrants.ts';
import { listAuthorizedGrants } from '../src/utils/pubky.ts';
import {
	incrementAuthorizedGrantCount,
	loadAuthorizedGrantsFailed,
	loadAuthorizedGrantsStarted,
	loadAuthorizedGrantsSucceeded,
} from '../src/store/slices/authorizedGrantsSlice.ts';

jest.mock('../src/utils/pubky.ts', () => ({
	listAuthorizedGrants: jest.fn(),
}));

jest.mock('../src/store/slices/authorizedGrantsSlice.ts', () => ({
	incrementAuthorizedGrantCount: jest.fn(payload => ({ type: 'authorizedGrants/increment', payload })),
	loadAuthorizedGrantsFailed: jest.fn(payload => ({ type: 'authorizedGrants/failed', payload })),
	loadAuthorizedGrantsStarted: jest.fn(payload => ({ type: 'authorizedGrants/started', payload })),
	loadAuthorizedGrantsSucceeded: jest.fn(payload => ({ type: 'authorizedGrants/succeeded', payload })),
}));

const listAuthorizedGrantsMock = listAuthorizedGrants as jest.MockedFunction<typeof listAuthorizedGrants>;

const grant = {
	grant_id: 'grant-1',
	client_id: 'example.app',
	capabilities: '/pub/example.app/:rw',
	issued_at: 1,
	expires_at: 2,
};

describe('refreshAuthorizedGrants', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('stores the filtered grant list for Home and Pubky Detail', async () => {
		listAuthorizedGrantsMock.mockResolvedValue(ok({ grants: [grant], sessionId: 'ring-session' }));
		const dispatch = jest.fn();

		const result = await refreshAuthorizedGrants({ pubky: 'user-pubky', dispatch });

		expect(result.isOk()).toBe(true);
		expect(loadAuthorizedGrantsStarted).toHaveBeenCalledWith({
			pubky: 'user-pubky',
			requestId: expect.any(Number),
		});
		expect(loadAuthorizedGrantsSucceeded).toHaveBeenCalledWith({
			pubky: 'user-pubky',
			requestId: expect.any(Number),
			grants: [grant],
			sessionId: 'ring-session',
		});
		expect(dispatch).toHaveBeenCalledTimes(2);
	});

	it('records a refresh failure without replacing the cached list', async () => {
		listAuthorizedGrantsMock.mockResolvedValue(err('Offline'));
		const dispatch = jest.fn();

		const result = await refreshAuthorizedGrants({ pubky: 'user-pubky', dispatch });

		expect(result.isErr()).toBe(true);
		expect(loadAuthorizedGrantsFailed).toHaveBeenCalledWith({
			pubky: 'user-pubky',
			requestId: expect.any(Number),
			error: 'Offline',
		});
		expect(dispatch).toHaveBeenCalledTimes(2);
	});

	it('coalesces simultaneous refreshes for the same pubky', async () => {
		listAuthorizedGrantsMock.mockResolvedValue(ok({ grants: [grant], sessionId: 'ring-session' }));
		const dispatch = jest.fn();

		const results = await Promise.all([
			refreshAuthorizedGrants({ pubky: 'user-pubky', dispatch }),
			refreshAuthorizedGrants({ pubky: 'user-pubky', dispatch }),
		]);

		expect(results.every(result => result.isOk())).toBe(true);
		expect(listAuthorizedGrantsMock).toHaveBeenCalledTimes(1);
	});

	it('reloads after an in-flight request when grants have changed', async () => {
		let resolveInitialRequest: (
			result: ReturnType<typeof ok<{ grants: (typeof grant)[]; sessionId: string }>>,
		) => void;
		listAuthorizedGrantsMock
			.mockImplementationOnce(
				() =>
					new Promise(resolve => {
						resolveInitialRequest = resolve;
					}),
			)
			.mockResolvedValueOnce(ok({ grants: [grant], sessionId: 'ring-session' }));
		const dispatch = jest.fn();

		const initialRefresh = refreshAuthorizedGrants({ pubky: 'user-pubky', dispatch });
		const postAuthorizationRefresh = refreshAuthorizedGrants({
			pubky: 'user-pubky',
			dispatch,
			forceReload: true,
		});

		expect(listAuthorizedGrantsMock).toHaveBeenCalledTimes(1);
		resolveInitialRequest!(ok({ grants: [], sessionId: 'ring-session' }));
		await initialRefresh;
		const result = await postAuthorizationRefresh;

		expect(result.isOk()).toBe(true);
		expect(listAuthorizedGrantsMock).toHaveBeenCalledTimes(2);
		if (result.isOk()) {
			expect(result.value.grants).toEqual([grant]);
		}
	});

	it('updates the count immediately and retries until an authorized grant is listed', async () => {
		listAuthorizedGrantsMock
			.mockResolvedValueOnce(ok({ grants: [], sessionId: 'ring-session' }))
			.mockResolvedValueOnce(ok({ grants: [grant], sessionId: 'ring-session' }));
		const dispatch = jest.fn();

		const resultPromise = refreshAuthorizedGrantsAfterAuthorization({
			pubky: 'user-pubky',
			dispatch,
			currentCount: 0,
		});

		expect(incrementAuthorizedGrantCount).toHaveBeenCalledWith({ pubky: 'user-pubky' });
		const result = await resultPromise;

		expect(result.isOk()).toBe(true);
		expect(listAuthorizedGrantsMock).toHaveBeenCalledTimes(2);
		expect(loadAuthorizedGrantsSucceeded).toHaveBeenCalledTimes(1);
	});
});
