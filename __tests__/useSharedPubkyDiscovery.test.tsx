import { act, renderHook, waitFor } from '@testing-library/react-native';
import { showToast } from '@synonymdev/react-native-toast';
import { useSharedPubkyDiscovery } from '../src/hooks/useSharedPubkyDiscovery';
import { disconnectBorrowedPubky } from '../src/utils/pubky';
import { getBorrowedPubkyKeys } from '../src/store/selectors/pubkySelectors';
import { discoverSharedPubkys } from '../src/utils/sharedPubky';
import { removeDisconnectedPubkyDetail } from '../src/sheets/sheetNavigation';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => mockDispatch,
}));

// Keys are read straight from the mocked store snapshot below.
jest.mock('../src/store/selectors/pubkySelectors', () => ({
	__esModule: true,
	getBorrowedPubkyKeys: jest.fn(() => []),
	getOwnedPubkyKeys: jest.fn(() => []),
	getPubkyKeys: jest.fn(() => []),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getStore: jest.fn(() => ({})),
}));

// The real module reaches the native bridge and the singleton store.
jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	disconnectBorrowedPubky: jest.fn(async () => true),
	getProfileAvatar: jest.fn(async () => ({ isOk: (): boolean => false })),
	getProfileInfo: jest.fn(async () => ({ isOk: (): boolean => false })),
	reconcileOwnedSharedPubkys: jest.fn(async () => undefined),
}));

jest.mock('../src/utils/sharedPubky', () => ({
	__esModule: true,
	discoverSharedPubkys: jest.fn(async () => ({ available: true, identities: [] })),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key },
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	removeDisconnectedPubkyDetail: jest.fn(),
}));

const showToastMock = showToast as jest.MockedFunction<typeof showToast>;
const disconnectBorrowedPubkyMock = disconnectBorrowedPubky as jest.MockedFunction<
	typeof disconnectBorrowedPubky
>;
const getBorrowedPubkyKeysMock = getBorrowedPubkyKeys as unknown as jest.MockedFunction<() => string[]>;
const discoverSharedPubkysMock = discoverSharedPubkys as jest.MockedFunction<typeof discoverSharedPubkys>;
const removeDisconnectedPubkyDetailMock = removeDisconnectedPubkyDetail as jest.MockedFunction<
	typeof removeDisconnectedPubkyDetail
>;

const BORROWED_A = 'borrowedA';
const BORROWED_B = 'borrowedB';

const renderDiscovery = async (): Promise<void> => {
	renderHook(() => useSharedPubkyDiscovery());
	await waitFor(() => expect(discoverSharedPubkysMock).toHaveBeenCalled());
};

beforeEach(() => {
	jest.clearAllMocks();
	getBorrowedPubkyKeysMock.mockReturnValue([]);
	disconnectBorrowedPubkyMock.mockResolvedValue(true);
	discoverSharedPubkysMock.mockResolvedValue({ available: true, identities: [] });
});

test('explains an automatic disconnect exactly once, however many identities went away', async () => {
	getBorrowedPubkyKeysMock.mockReturnValue([BORROWED_A, BORROWED_B]);

	await renderDiscovery();

	await waitFor(() => expect(disconnectBorrowedPubkyMock).toHaveBeenCalledTimes(2));
	expect(removeDisconnectedPubkyDetailMock).toHaveBeenCalledWith(BORROWED_A);
	expect(removeDisconnectedPubkyDetailMock).toHaveBeenCalledWith(BORROWED_B);
	await waitFor(() => expect(showToastMock).toHaveBeenCalledTimes(1));
	expect(showToastMock).toHaveBeenCalledWith(
		expect.objectContaining({
			type: 'info',
			description: 'reuseSharedPubky.noLongerShared',
		}),
	);
});

test('explains the disconnect when the source app is gone entirely', async () => {
	discoverSharedPubkysMock.mockResolvedValue({ available: false, identities: [] });
	getBorrowedPubkyKeysMock.mockReturnValue([BORROWED_A]);

	await renderDiscovery();

	await waitFor(() => expect(disconnectBorrowedPubkyMock).toHaveBeenCalledWith(BORROWED_A, mockDispatch));
	expect(removeDisconnectedPubkyDetailMock).toHaveBeenCalledWith(BORROWED_A);
	await waitFor(() => expect(showToastMock).toHaveBeenCalledTimes(1));
});

test('says nothing when every borrowed identity is still shared', async () => {
	getBorrowedPubkyKeysMock.mockReturnValue([BORROWED_A]);
	discoverSharedPubkysMock.mockResolvedValue({
		available: true,
		identities: [{ version: 1, sourceApp: 'to.bitkit', pubky: BORROWED_A }],
	});

	await renderDiscovery();

	await waitFor(() => expect(disconnectBorrowedPubkyMock).not.toHaveBeenCalled());
	expect(showToastMock).not.toHaveBeenCalled();
});

test('retains the last discovery and borrowed identities on failure, then recovers', async () => {
	getBorrowedPubkyKeysMock.mockReturnValue([BORROWED_A]);
	const identity = { version: 1, sourceApp: 'to.bitkit', pubky: BORROWED_A } as const;
	discoverSharedPubkysMock.mockResolvedValue({ available: true, identities: [identity] });
	const { result } = renderHook(() => useSharedPubkyDiscovery());
	await waitFor(() => expect(result.current.identities).toEqual([identity]));
	discoverSharedPubkysMock.mockRejectedValueOnce(new Error('provider temporarily unavailable'));
	await act(async () => {
		await expect(result.current.refresh()).rejects.toThrow('provider temporarily unavailable');
	});
	expect(result.current.identities).toEqual([identity]);
	expect(disconnectBorrowedPubkyMock).not.toHaveBeenCalled();
	expect(showToastMock).not.toHaveBeenCalled();
	discoverSharedPubkysMock.mockResolvedValue({ available: true, identities: [] });
	await act(async () => result.current.refresh());
	expect(disconnectBorrowedPubkyMock).toHaveBeenCalledWith(BORROWED_A, mockDispatch);
});

test('says nothing when another flow already removed the identity', async () => {
	// A failed Authorize disconnects and explains it itself, so the reconcile must stay quiet.
	getBorrowedPubkyKeysMock.mockReturnValue([BORROWED_A]);
	disconnectBorrowedPubkyMock.mockResolvedValue(false);

	await renderDiscovery();

	await waitFor(() => expect(disconnectBorrowedPubkyMock).toHaveBeenCalledTimes(1));
	expect(showToastMock).not.toHaveBeenCalled();
	expect(removeDisconnectedPubkyDetailMock).not.toHaveBeenCalled();
});

test('runs one queued refresh when refresh is requested during an active refresh', async () => {
	let finishFirstDiscovery = (): void => {};
	discoverSharedPubkysMock.mockImplementationOnce(
		() =>
			new Promise(resolve => {
				finishFirstDiscovery = () => resolve({ available: true, identities: [] });
			}),
	);
	const { result } = renderHook(() => useSharedPubkyDiscovery());
	await waitFor(() => expect(discoverSharedPubkysMock).toHaveBeenCalledTimes(1));

	let firstQueuedRefresh!: Promise<void>;
	let secondQueuedRefresh!: Promise<void>;
	act(() => {
		firstQueuedRefresh = result.current.refresh();
		secondQueuedRefresh = result.current.refresh();
	});
	expect(firstQueuedRefresh).toBe(secondQueuedRefresh);
	expect(discoverSharedPubkysMock).toHaveBeenCalledTimes(1);

	await act(async () => {
		finishFirstDiscovery();
		await firstQueuedRefresh;
	});

	expect(discoverSharedPubkysMock).toHaveBeenCalledTimes(2);
});

test('runs the queued refresh after the active refresh fails', async () => {
	let failFirstDiscovery = (): void => {};
	discoverSharedPubkysMock.mockImplementationOnce(
		() =>
			new Promise((_resolve, reject) => {
				failFirstDiscovery = () => reject(new Error('temporary discovery failure'));
			}),
	);
	const { result } = renderHook(() => useSharedPubkyDiscovery());
	await waitFor(() => expect(discoverSharedPubkysMock).toHaveBeenCalledTimes(1));

	let queuedRefresh!: Promise<void>;
	act(() => {
		queuedRefresh = result.current.refresh();
	});

	await act(async () => {
		failFirstDiscovery();
		await queuedRefresh;
	});

	expect(discoverSharedPubkysMock).toHaveBeenCalledTimes(2);
});
