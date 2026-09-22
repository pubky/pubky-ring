import type { Dispatch } from 'redux';
import { persistPubkySessionCleanup } from '../src/store/persistPubkySessionCleanup';
import pubkysReducer from '../src/store/slices/pubkysSlice';
import { initialState } from '../src/store/shapes/pubky';
import type { PubkyState } from '../src/types/pubky';

const mockSet = jest.fn();
const mockGetString = jest.fn();
const mockValues = new Map<string, string>();
let mockState: { pubky: PubkyState };
let mockPersistoid: {
	update: (state: { pubky: PubkyState }) => void;
	flush: () => Promise<void>;
};

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('react-native-mmkv', () => ({
	createMMKV: () => ({
		set: (...args: unknown[]) => mockSet(...args),
		getString: (...args: unknown[]) => mockGetString(...args),
	}),
}));
jest.mock('../src/store', () => ({
	store: { getState: () => mockState },
	persistor: { flush: () => mockPersistoid.flush() },
}));

const dispatch: Dispatch = action => {
	mockState = { pubky: pubkysReducer(mockState.pubky, action) };
	mockPersistoid.update(mockState);
	return action;
};

const writeDurableState = (state: PubkyState): void => {
	mockValues.set('persist:root', JSON.stringify({ pubky: JSON.stringify(state) }));
};

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	mockValues.clear();
	mockState = { pubky: { ...initialState, pendingSessionCleanup: {} } };
	mockSet.mockImplementation((key: string, value: string) => {
		mockValues.set(key, value);
	});
	mockGetString.mockImplementation((key: string) => mockValues.get(key));
	const createPersistoid = jest.requireActual('redux-persist/lib/createPersistoid').default;
	const { reduxStorage } = jest.requireActual('../src/store/mmkv-storage');
	mockPersistoid = createPersistoid({ key: 'root', storage: reduxStorage, whitelist: ['pubky'] });
});

afterEach(() => {
	jest.clearAllTimers();
	jest.useRealTimers();
});

test('requeues a completed cleanup after an earlier timed MMKV write drained the persistence queue', async () => {
	writeDurableState({ ...initialState, pendingSessionCleanup: { old: ['old'] } });
	mockSet.mockImplementationOnce(() => {
		throw new Error('disk full');
	});
	mockPersistoid.update(mockState);
	expect(() => jest.advanceTimersByTime(1)).toThrow('disk full');
	// The exact redux-persist failure: the queue is empty, so a plain second flush is a no-op.
	await mockPersistoid.flush();
	expect(JSON.parse(JSON.parse(mockValues.get('persist:root')!).pubky).pendingSessionCleanup).toEqual({
		old: ['old'],
	});

	await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(true);
	expect(JSON.parse(JSON.parse(mockValues.get('persist:root')!).pubky).pendingSessionCleanup).toEqual({});
});

test('fails closed on flush rejection and succeeds after retrying the write', async () => {
	writeDurableState({ ...initialState, pendingSessionCleanup: { old: ['old'] } });
	mockSet.mockImplementationOnce(() => {
		throw new Error('disk full');
	});
	await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(false);
	await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(true);
});

test('requires readable current cleanup state on disk, including after a flush silently writes nothing', async () => {
	writeDurableState({ ...initialState, pendingSessionCleanup: { old: ['old'] } });
	mockSet.mockImplementationOnce(() => undefined);
	await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(false);
	mockGetString.mockImplementationOnce(() => {
		throw new Error('read failed');
	});
	await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(false);
	await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(true);
});

test.each([undefined, '{}', JSON.stringify({ pubky: JSON.stringify({ pubkys: {} }) })])(
	'does not treat missing durable cleanup state as success: %s',
	async value => {
		mockGetString.mockReturnValueOnce(value);
		await expect(persistPubkySessionCleanup(dispatch)).resolves.toBe(false);
	},
);
