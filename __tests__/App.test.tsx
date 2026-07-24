import 'react-native';
import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

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
	showToast: jest.fn(),
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

jest.mock('react-native-toast-message', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'Toast' }),
	};
});

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

jest.mock('../src/theme/toastConfig.tsx', () => ({
	__esModule: true,
	toastConfig: () => ({}),
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

import App from '../App';

test('renders correctly', async () => {
	render(<App />);

	expect(screen.getByTestId('RootNavigator')).toBeTruthy();
});
