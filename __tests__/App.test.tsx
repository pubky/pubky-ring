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

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => jest.fn(),
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
	setDeepLink: (payload: unknown) => ({ type: 'pubky/setDeepLink', payload }),
}));

jest.mock('../src/utils/helpers.ts', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(),
}));

jest.mock('../src/utils/inputParser.ts', () => ({
	__esModule: true,
	parseInput: jest.fn(async input => ({ rawInput: input })),
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
		SafeAreaView: ({ children }: { children?: ReactNode }) =>
			ReactMock.createElement(View, null, children),
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
import { resetClaimedInitialUrl } from '../src/utils/initialUrl.ts';

const mockedParseInput = parseInput as jest.Mock;

const AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=abc';

test('renders correctly', async () => {
	render(<App />);

	expect(screen.getByTestId('RootNavigator')).toBeTruthy();
});

test('routes the launch URL once per launch, not once per mount', async () => {
	const getInitialURL = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(AUTH_URL);
	mockedParseInput.mockClear();
	resetClaimedInitialUrl();

	const first = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledWith(AUTH_URL, 'deeplink'));
	first.unmount();

	// Remounting reads the same launch intent again; it is not a second deeplink.
	getInitialURL.mockClear();
	const second = render(<App />);
	await waitFor(() => expect(getInitialURL).toHaveBeenCalled());
	await act(async () => {});
	second.unmount();

	expect(mockedParseInput).toHaveBeenCalledTimes(1);

	getInitialURL.mockRestore();
});

test('routes the same URL again on a later launch', async () => {
	const getInitialURL = jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(AUTH_URL);
	mockedParseInput.mockClear();
	resetClaimedInitialUrl();

	const first = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(1));
	first.unmount();

	// New process, user re-opening the link after a failed attempt: must be handled again.
	resetClaimedInitialUrl();
	const second = render(<App />);
	await waitFor(() => expect(mockedParseInput).toHaveBeenCalledTimes(2));
	second.unmount();

	getInitialURL.mockRestore();
});
