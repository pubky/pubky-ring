import React from 'react';
import { Alert, NativeModules } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components/native';
import { darkTheme } from '../src/theme';
import SettingsScreen from '../src/screens/SettingsScreen';
import settingsReducer, {
	resetSettings,
	updateAlwaysShowAuthDetails,
	updateAutoAuth,
} from '../src/store/slices/settingsSlice';
import { initialState } from '../src/store/shapes/settings';

// Keep real Redux behavior while avoiding untransformed React Native ESM exports in Jest.
jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('react-redux', () => jest.requireActual('../node_modules/react-redux/dist/cjs/index.js'));

jest.mock('../src/utils/store-helpers', () => ({
	getStore: () => ({ settings: { requireDeviceAuth: false } }),
}));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

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

jest.mock('../src/icons/index.ts', () => ({ Info: () => null, Qrcode: () => null, Scan: () => null }));

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

const renderSettings = (
	params?: { showSecretSettings: boolean },
	autoAuth = false,
	requireDeviceAuth = false,
) => {
	const store = configureStore({
		reducer: { settings: settingsReducer },
		preloadedState: { settings: { ...initialState, autoAuth, requireDeviceAuth } },
	});

	render(
		<Provider store={store}>
			<ThemeProvider theme={darkTheme}>
				<SettingsScreen
					navigation={{ reset: jest.fn() } as never}
					route={{ key: 'Settings', name: 'Settings', params } as never}
				/>
			</ThemeProvider>
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

		fireEvent(screen.getByTestId('AutoAuthSwitch'), 'valueChange', true);
		expect(store.getState().settings.autoAuth).toBe(true);
		expect(screen.getByTestId('AutoAuthSwitch').props.value).toBe(true);

		act(() => {
			store.dispatch(updateAutoAuth({ autoAuth: false }));
		});
		expect(screen.getByTestId('AutoAuthSwitch').props.value).toBe(false);
	});

	it('saves the auth display preference in release builds and responds to store changes', () => {
		jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', false);
		const store = renderSettings();
		expect(screen.getByTestId('AuthShowBasicsOption')).toHaveProp('accessibilityState', { checked: true });
		fireEvent.press(screen.getByTestId('AuthAlwaysShowDetailsOption'));
		expect(store.getState().settings.alwaysShowAuthDetails).toBe(true);
		expect(screen.getByTestId('AuthAlwaysShowDetailsOption')).toHaveProp('accessibilityState', {
			checked: true,
		});
		act(() => {
			store.dispatch(updateAlwaysShowAuthDetails({ alwaysShowAuthDetails: false }));
		});
		expect(screen.getByTestId('AuthShowBasicsOption')).toHaveProp('accessibilityState', { checked: true });
	});

	it('restores the basic display preference when settings are reset', () => {
		const store = renderSettings();
		fireEvent.press(screen.getByTestId('AuthAlwaysShowDetailsOption'));
		act(() => {
			store.dispatch(resetSettings());
		});
		expect(store.getState().settings.alwaysShowAuthDetails).toBe(false);
		expect(screen.getByTestId('AuthShowBasicsOption')).toHaveProp('accessibilityState', { checked: true });
	});
});

describe('device authentication preference', () => {
	beforeEach(() => {
		NativeModules.DeviceAuthentication = {
			getAvailability: jest.fn(async () => ({ available: true, biometry: 'face' })),
			authenticate: jest.fn(async () => true),
			cancel: jest.fn(),
			openEnrollment: jest.fn(),
		};
	});
	afterEach(() => jest.restoreAllMocks());

	it('keeps explanations and the device settings shortcut behind the info button', async () => {
		const alert = jest.spyOn(Alert, 'alert');
		const store = renderSettings();
		expect(screen.queryByText('deviceAuth.description')).toBeNull();
		expect(screen.queryByText('deviceAuth.enrollmentGuidance')).toBeNull();
		expect(screen.queryByText('deviceAuth.openSettings')).toBeNull();
		fireEvent.press(screen.getByRole('button', { name: 'deviceAuth.learnMore' }));
		expect(alert).toHaveBeenCalledWith(
			'deviceAuth.setting',
			'deviceAuth.description\n\ndeviceAuth.enrollmentGuidance',
			expect.any(Array),
		);
		await act(async () => {
			alert.mock.calls[0][2]?.[1].onPress?.();
		});
		expect(NativeModules.DeviceAuthentication.openEnrollment).toHaveBeenCalledTimes(1);
		expect(NativeModules.DeviceAuthentication.authenticate).not.toHaveBeenCalled();
		expect(store.getState().settings.requireDeviceAuth).toBe(false);
	});

	it('explains the scope and enables only after a successful verification', async () => {
		const alert = jest.spyOn(Alert, 'alert');
		const store = renderSettings();
		fireEvent(screen.getByTestId('RequireDeviceAuthSwitch'), 'valueChange', true);
		expect(store.getState().settings.requireDeviceAuth).toBe(false);
		await act(async () => {
			alert.mock.calls[0][2]?.[1].onPress?.();
		});
		expect(NativeModules.DeviceAuthentication.authenticate).toHaveBeenCalledTimes(1);
		expect(store.getState().settings.requireDeviceAuth).toBe(true);
		expect(screen.getByTestId('AutoAuthSwitch')).toHaveProp('disabled', true);
	});

	it('keeps protection enabled if disabling is cancelled or unavailable', async () => {
		const store = renderSettings(undefined, true, true);
		NativeModules.DeviceAuthentication.authenticate.mockRejectedValueOnce({ code: 'cancelled' });
		await act(async () => {
			fireEvent(screen.getByTestId('RequireDeviceAuthSwitch'), 'valueChange', false);
		});
		expect(store.getState().settings.requireDeviceAuth).toBe(true);
		NativeModules.DeviceAuthentication.getAvailability.mockResolvedValueOnce({
			available: false,
			biometry: 'none',
		});
		await act(async () => {
			fireEvent(screen.getByTestId('RequireDeviceAuthSwitch'), 'valueChange', false);
		});
		expect(store.getState().settings.requireDeviceAuth).toBe(true);
		expect(screen.getByText('deviceAuth.unavailable')).toBeTruthy();
	});

	it('does not enable protection on a device without a secure screen lock', async () => {
		const alert = jest.spyOn(Alert, 'alert');
		NativeModules.DeviceAuthentication.getAvailability.mockResolvedValueOnce({
			available: false,
			biometry: 'none',
		});
		const store = renderSettings();
		fireEvent(screen.getByTestId('RequireDeviceAuthSwitch'), 'valueChange', true);
		await act(async () => {
			alert.mock.calls[0][2]?.[1].onPress?.();
		});
		expect(store.getState().settings.requireDeviceAuth).toBe(false);
		expect(NativeModules.DeviceAuthentication.authenticate).not.toHaveBeenCalled();
	});
});
