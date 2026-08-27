import 'react-native';
import React, { ReactNode } from 'react';
import { Linking } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('../src/navigation/RootNavigator.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'RootNavigator' }),
	};
});

const mockState = {
	settings: {
		theme: 'dark',
		isOnline: true,
	},
};
const mockDispatch = jest.fn();

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState),
	shallowEqual: jest.fn(),
}));

jest.mock('../src/store/selectors/settingsSelectors.ts', () => ({
	__esModule: true,
	getTheme: (state: typeof mockState) => state.settings.theme,
	getIsOnline: (state: typeof mockState) => state.settings.isOnline,
}));

jest.mock('../src/store/slices/settingsSlice.ts', () => ({
	__esModule: true,
	updateIsOnline: (payload: unknown) => ({ type: 'settings/updateIsOnline', payload }),
}));

jest.mock('../src/store/slices/pubkysSlice.ts', () => ({
	__esModule: true,
	queueDeepLink: (payload: unknown) => ({ type: 'pubky/queueDeepLink', payload }),
}));

jest.mock('../src/utils/helpers.ts', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(),
}));

jest.mock('../src/utils/inputParser.ts', () => ({
	__esModule: true,
	parseInput: jest.fn(async input => ({ rawInput: input })),
}));

const mockConsumeInitialUrls = jest.fn<Promise<string[]>, []>();
const mockConsumeUrlEvent = jest.fn<Promise<string[]>, [string]>();
const mockHasNativeInitialUrlInbox = jest.fn<boolean, []>();

jest.mock('../src/utils/initialUrl.ts', () => ({
	__esModule: true,
	consumeInitialUrls: () => mockConsumeInitialUrls(),
	consumeUrlEvent: (url: string) => mockConsumeUrlEvent(url),
	hasNativeInitialUrlInbox: () => mockHasNativeInitialUrlInbox(),
}));

jest.mock('@react-native-community/netinfo', () => ({
	__esModule: true,
	default: {
		addEventListener: jest.fn(() => jest.fn()),
	},
}));

jest.mock('react-native-safe-area-context', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		SafeAreaProvider: ({ children }: { children?: ReactNode }) =>
			ReactMock.createElement(View, null, children),
		SafeAreaView: ({ children }: { children?: ReactNode }) => ReactMock.createElement(View, null, children),
		useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
		useSafeAreaFrame: () => ({ x: 0, y: 0, width: 320, height: 640 }),
	};
});

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	configureToast: jest.fn(),
	showToast: jest.fn(),
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

import App from '../App';
import { parseInput } from '../src/utils/inputParser.ts';

const mockedParseInput = parseInput as jest.Mock;

const AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=abc';
const OTHER_AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=def';

let mockUrlListener: ((event: { url: string }) => void) | undefined;
const mockRemoveUrlListener = jest.fn();

beforeEach(() => {
	mockedParseInput.mockReset().mockImplementation(async input => ({ rawInput: input }));
	mockDispatch.mockClear();
	mockConsumeInitialUrls.mockReset().mockResolvedValue([]);
	mockConsumeUrlEvent.mockReset().mockImplementation(async url => [url]);
	mockHasNativeInitialUrlInbox.mockReset().mockReturnValue(true);
	mockRemoveUrlListener.mockClear();
	mockUrlListener = undefined;

	jest.spyOn(Linking, 'addEventListener').mockImplementation((_type, listener) => {
		mockUrlListener = listener;
		return { remove: mockRemoveUrlListener } as unknown as ReturnType<typeof Linking.addEventListener>;
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

test('renders correctly', async () => {
	render(<App />);

	expect(screen.getByTestId('RootNavigator')).toBeTruthy();
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));
});

test('routes an initial URL once for the same Activity', async () => {
	mockConsumeInitialUrls.mockResolvedValueOnce([AUTH_URL]).mockResolvedValueOnce([]);

	const first = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledWith(AUTH_URL, 'deeplink'));
	first.unmount();

	const second = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(2));
	await act(async () => {});
	second.unmount();

	expect(mockedParseInput).toHaveBeenCalledTimes(1);
});

test('routes the same URL from a new Activity in the existing process', async () => {
	mockConsumeInitialUrls.mockResolvedValue([AUTH_URL]);

	const firstActivity = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(1));
	firstActivity.unmount();

	const secondActivity = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(2));
	secondActivity.unmount();
});

test('routes repeated identical live URL events', async () => {
	const view = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));

	act(() => {
		mockUrlListener?.({ url: AUTH_URL });
		mockUrlListener?.({ url: AUTH_URL });
	});
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(2));
	view.unmount();

	expect(mockConsumeUrlEvent).toHaveBeenCalledTimes(2);
	expect(mockDispatch).toHaveBeenCalledTimes(2);
});

test('preserves live URL order when the first parse is slower', async () => {
	let resolveFirstParse: (value: { rawInput: string }) => void = () => {};
	mockedParseInput.mockImplementation((input: string) => {
		if (input === AUTH_URL) {
			return new Promise(resolve => {
				resolveFirstParse = resolve;
			});
		}
		return Promise.resolve({ rawInput: input });
	});

	const view = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));

	act(() => {
		mockUrlListener?.({ url: AUTH_URL });
		mockUrlListener?.({ url: OTHER_AUTH_URL });
	});
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledWith(AUTH_URL, 'deeplink'));
	expect(mockedParseInput).not.toHaveBeenCalledWith(OTHER_AUTH_URL, 'deeplink');

	await act(async () => resolveFirstParse({ rawInput: AUTH_URL }));
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledWith(OTHER_AUTH_URL, 'deeplink'));
	view.unmount();

	expect(mockDispatch.mock.calls.map(([action]) => action.payload)).toEqual([
		JSON.stringify({ rawInput: AUTH_URL }),
		JSON.stringify({ rawInput: OTHER_AUTH_URL }),
	]);
});

test('continues a native inbox batch after one URL fails to parse', async () => {
	jest.spyOn(console, 'error').mockImplementation(() => {});
	mockConsumeInitialUrls.mockResolvedValue([AUTH_URL, OTHER_AUTH_URL]);
	mockedParseInput
		.mockRejectedValueOnce(new Error(AUTH_URL))
		.mockResolvedValueOnce({ rawInput: OTHER_AUTH_URL });

	const view = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(2));
	await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1));
	view.unmount();

	expect(mockDispatch).toHaveBeenCalledWith({
		type: 'pubky/queueDeepLink',
		payload: JSON.stringify({ rawInput: OTHER_AUTH_URL }),
	});
	expect(console.error).toHaveBeenCalledTimes(1);
	expect(console.error).toHaveBeenCalledWith('Error handling deep link');
	expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining(AUTH_URL));
});

test('does not replay a handled live URL after a root remount', async () => {
	const first = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));

	act(() => mockUrlListener?.({ url: AUTH_URL }));
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(1));
	first.unmount();

	const second = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(2));
	await act(async () => {});
	second.unmount();

	expect(mockedParseInput).toHaveBeenCalledTimes(1);
});

test('does not duplicate a native live URL while the initial inbox drain is pending', async () => {
	let resolveInitialUrls: (urls: string[]) => void = () => {};
	mockConsumeInitialUrls.mockReturnValue(
		new Promise(resolve => {
			resolveInitialUrls = resolve;
		}),
	);
	mockConsumeUrlEvent.mockResolvedValue([AUTH_URL]);

	const view = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));
	act(() => mockUrlListener?.({ url: AUTH_URL }));
	expect(mockedParseInput).not.toHaveBeenCalled();

	await act(async () => resolveInitialUrls([]));
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(1));
	view.unmount();

	expect(mockedParseInput).toHaveBeenCalledTimes(1);
});

test('prefers a fallback live event over the same pending initial URL', async () => {
	let resolveInitialUrls: (urls: string[]) => void = () => {};
	mockHasNativeInitialUrlInbox.mockReturnValue(false);
	mockConsumeInitialUrls.mockReturnValue(
		new Promise(resolve => {
			resolveInitialUrls = resolve;
		}),
	);
	mockConsumeUrlEvent.mockResolvedValue([AUTH_URL]);

	const view = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));
	act(() => mockUrlListener?.({ url: AUTH_URL }));
	expect(mockedParseInput).not.toHaveBeenCalled();

	await act(async () => resolveInitialUrls([AUTH_URL]));
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(1));
	view.unmount();

	expect(mockedParseInput).toHaveBeenCalledTimes(1);
});

test('routes a pending initial URL before a different fallback live event', async () => {
	let resolveInitialUrls: (urls: string[]) => void = () => {};
	mockHasNativeInitialUrlInbox.mockReturnValue(false);
	mockConsumeInitialUrls.mockReturnValue(
		new Promise(resolve => {
			resolveInitialUrls = resolve;
		}),
	);
	mockConsumeUrlEvent.mockResolvedValue([OTHER_AUTH_URL]);

	const view = render(<App />);
	await waitFor(() => expect(mockConsumeInitialUrls).toHaveBeenCalledTimes(1));
	act(() => mockUrlListener?.({ url: OTHER_AUTH_URL }));
	expect(mockedParseInput).not.toHaveBeenCalled();

	await act(async () => resolveInitialUrls([AUTH_URL]));
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(2));
	view.unmount();

	expect(mockedParseInput.mock.calls.map(([url]) => url)).toEqual([AUTH_URL, OTHER_AUTH_URL]);
});
