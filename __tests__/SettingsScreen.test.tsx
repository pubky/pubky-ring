import React from 'react';
import { Switch } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import SettingsScreen from '../src/screens/SettingsScreen';
import settingsReducer, { updateAutoAuth } from '../src/store/slices/settingsSlice';
import { initialState } from '../src/store/shapes/settings';

// Keep real Redux behavior while avoiding untransformed React Native ESM exports in Jest.
jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('react-redux', () => jest.requireActual('../node_modules/react-redux/dist/cjs/index.js'));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/components/AppHeader.tsx', () => ({
	__esModule: true,
	default: () => null,
	HEADER_HEIGHT: 56,
}));

jest.mock('../src/components/SafeAreaView.tsx', () => ({
	__esModule: true,
	default: require('react-native').View,
}));

jest.mock('../src/components/Button.tsx', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');
	return {
		__esModule: true,
		default: ({ text, ...props }: { text: string }) =>
			ReactMock.createElement(Pressable, props, ReactMock.createElement(Text, null, text)),
	};
});

jest.mock('../src/theme/components.ts', () => ({
	ThemedView: require('react-native').View,
}));

jest.mock('../src/theme/typography', () => {
	const { Text } = require('react-native');
	return { TextBaseB: Text, TextBaseM: Text, TextSmM: Text, TextXsM: Text };
});

jest.mock('../src/icons/index.ts', () => ({ Qrcode: () => null, Scan: () => null }));

jest.mock('../src/store/selectors/pubkySelectors.ts', () => {
	const pubkys = { 'test-pubky': { homeserver: 'homeserver.example' } };
	const pubkyKeys = ['test-pubky'];
	return { getAllPubkys: () => pubkys, getPubkyKeys: () => pubkyKeys };
});

jest.mock('../src/utils/keychain.ts', () => ({ wipeKeychain: jest.fn() }));
jest.mock('../src/store/slices/pubkysSlice.ts', () => ({ resetPubkys: jest.fn() }));
jest.mock('../src/utils/pubky.ts', () => ({ republishAllHomeserverRecords: jest.fn() }));
jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ showSheet: jest.fn() }));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));

const developerLabels = [
	'settings.developer',
	'settings.navigationAnimation',
	'settings.autoAuth',
	'settings.showOnboarding',
	'settings.wipePubkyRing',
];

const renderSettings = (params?: { showSecretSettings: boolean }, autoAuth = false) => {
	const store = configureStore({
		reducer: { settings: settingsReducer },
		preloadedState: { settings: { ...initialState, autoAuth } },
	});

	render(
		<Provider store={store}>
			<SettingsScreen
				navigation={{ reset: jest.fn() } as never}
				route={{ key: 'Settings', name: 'Settings', params } as never}
			/>
		</Provider>,
	);
	return store;
};

describe('SettingsScreen developer settings', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([undefined, { showSecretSettings: false }])(
		'shows developer settings in development without a secret route parameter (%j)',
		params => {
			jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', true);
			renderSettings(params);

			for (const label of developerLabels) {
				expect(screen.getByText(label)).toBeTruthy();
			}
		},
	);

	it.each([undefined, { showSecretSettings: true }])(
		'hides developer settings in release, even with a legacy route parameter (%j)',
		params => {
			jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', false);
			renderSettings(params, true);

			for (const label of developerLabels) {
				expect(screen.queryByText(label)).toBeNull();
			}
			expect(screen.getByTestId('ShowQRButton')).toBeTruthy();
			expect(screen.getByTestId('ScanQRButton')).toBeTruthy();
			expect(screen.getByTestId('RepublishAllButton')).toBeTruthy();
		},
	);

	it('keeps the development Auto Auth switch in sync with Redux', () => {
		jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', true);
		const store = renderSettings();

		fireEvent(screen.getByRole('switch'), 'valueChange', true);
		expect(store.getState().settings.autoAuth).toBe(true);
		expect(screen.UNSAFE_getByType(Switch).props.value).toBe(true);

		act(() => {
			store.dispatch(updateAutoAuth({ autoAuth: false }));
		});
		expect(screen.UNSAFE_getByType(Switch).props.value).toBe(false);
	});
});
