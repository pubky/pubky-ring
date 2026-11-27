import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components/native';
import { err, ok } from '@synonymdev/result';
import pubkyReducer from '../src/store/slices/pubkysSlice';
import settingsReducer from '../src/store/slices/settingsSlice';
import { defaultPubkyState, initialState as pubkyInitialState } from '../src/store/shapes/pubky';
import { initialState as settingsInitialState } from '../src/store/shapes/settings';
import { darkTheme } from '../src/theme';
import { PkdnsRecordsProvider } from '../src/components/EditPubky/PkdnsRecordsContext';
import EditPubkyPkdnsRecords from '../src/screens/EditPubkyPkdnsRecords';
import EditPubkyAddPkdnsRecord from '../src/screens/EditPubkyAddPkdnsRecord';
import EditPubkyMain from '../src/screens/EditPubkyMain';
import { clearPkdnsData } from '../src/utils/pkdnsStorage';
import type { Pubky } from '../src/types/pubky';
import type { PkdnsRecord } from '../src/utils/pkdnsRecords';

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('react-redux', () => jest.requireActual('../node_modules/react-redux/dist/cjs/index.js'));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('@synonymdev/react-native-pubky', () => ({
	resolveDnsRecords: jest.fn(),
	editDnsRecords: jest.fn(),
	republishPacket: jest.fn(),
}));
jest.mock('../src/utils/pubky', () => ({ getPubkySecretKey: jest.fn() }));
jest.mock('../src/utils/store-helpers', () => ({ getPubkyDataFromStore: () => ({ homeserver: 'hs' }) }));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));
jest.mock('../src/sheets/sheetNavigation', () => ({ hideSheet: jest.fn() }));
jest.mock('../src/icons', () => ({ Trash2: () => null, Scan: () => null }));
jest.mock('../src/components/Sheet', () => ({ SheetScreen: require('react-native').View }));
jest.mock('../src/components/ServerCardSmall', () => () => null);
jest.mock('../src/components/Button', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');
	return {
		__esModule: true,
		default: ({ text, loading, disabled, onPress, testID }: Record<string, never>) =>
			ReactMock.createElement(
				Pressable,
				{
					disabled: disabled || loading,
					onPress,
					testID,
					accessibilityState: { disabled: disabled || loading },
				},
				ReactMock.createElement(Text, null, text),
			),
	};
});
jest.mock('../src/components/TextField', () => {
	const ReactMock = require('react');
	const { Text, TextInput, View } = require('react-native');
	return {
		__esModule: true,
		default: ({ error, ...props }: { error?: string }) =>
			ReactMock.createElement(
				View,
				null,
				ReactMock.createElement(TextInput, props),
				error ? ReactMock.createElement(Text, null, error) : null,
			),
	};
});
jest.mock('../src/components/EditPubky/useEditPubkyForm', () => ({
	useEditPubkyForm: () => mockForm,
}));

let mockForm: Record<string, unknown> = {};
const { resolveDnsRecords: resolve, editDnsRecords: edit } = jest.requireMock<
	Record<'resolveDnsRecords' | 'editDnsRecords', jest.Mock>
>('@synonymdev/react-native-pubky');
const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const navigation = { navigate: jest.fn(), goBack: jest.fn() };
const route = { key: 'route', name: 'PkdnsRecords', params: { pubky: 'key' } } as never;
const aRecord: PkdnsRecord = { name: '@', type: 'A', ttl: 300, value: '192.0.2.1' };
const packet = (records: PkdnsRecord[], found = true) => ({
	found,
	signed_packet: found ? 'packet' : null,
	packet_size: 100,
	records,
	other_records: found ? 1 : 0,
});

const renderScreens = (children: React.ReactNode, { pubky = {}, isOnline = true } = {}) => {
	const store = configureStore({
		reducer: { pubky: pubkyReducer, settings: settingsReducer },
		preloadedState: {
			pubky: {
				...pubkyInitialState,
				pubkys: { key: { ...defaultPubkyState, homeserver: 'hs', ...(pubky as Partial<Pubky>) } },
			},
			settings: { ...settingsInitialState, isOnline },
		},
	});
	render(
		<Provider store={store}>
			<ThemeProvider theme={darkTheme}>
				<PkdnsRecordsProvider pubky="key">{children}</PkdnsRecordsProvider>
			</ThemeProvider>
		</Provider>,
	);
};
const recordsAndAddForm = (
	<>
		<EditPubkyPkdnsRecords navigation={navigation as never} route={route} />
		<EditPubkyAddPkdnsRecord navigation={navigation as never} route={route} />
	</>
);

beforeEach(() => {
	jest.clearAllMocks();
	clearPkdnsData('key');
	const { getPubkySecretKey } = jest.requireMock('../src/utils/pubky');
	getPubkySecretKey.mockResolvedValue(ok({ secretKey: 'secret', mnemonic: '' }));
});

it('adds a valid record and lists it', async () => {
	resolve.mockResolvedValue(ok(packet([])));
	const cname: PkdnsRecord = { name: 'www', type: 'CNAME', ttl: 3600, value: 'example.com' };
	edit.mockResolvedValue(ok(packet([cname])));
	renderScreens(recordsAndAddForm);
	expect(await screen.findByTestId('PkdnsRecordsEmpty')).toBeTruthy();

	fireEvent.press(screen.getByTestId('PkdnsRecordType-CNAME'));
	fireEvent.changeText(screen.getByTestId('PkdnsRecordNameInput'), 'www');
	fireEvent.changeText(screen.getByTestId('PkdnsRecordValueInput'), 'not a domain');
	await act(async () => fireEvent.press(screen.getByTestId('PkdnsAddRecordPublishButton')));
	expect(screen.getByText('pkdns.fieldErrors.domainInvalid')).toBeTruthy();
	expect(edit).not.toHaveBeenCalled();

	fireEvent.changeText(screen.getByTestId('PkdnsRecordValueInput'), 'example.com');
	fireEvent.press(screen.getByTestId('PkdnsRecordTtl-3600'));
	await act(async () => fireEvent.press(screen.getByTestId('PkdnsAddRecordPublishButton')));

	expect(edit).toHaveBeenCalledWith('secret', { add: [cname], remove: [] }, 'packet');
	expect(navigation.goBack).toHaveBeenCalled();
	expect(screen.getByTestId('PkdnsRecord-www|CNAME|example.com|')).toBeTruthy();
});

it('deletes a record after confirmation', async () => {
	resolve.mockResolvedValue(ok(packet([aRecord])));
	edit.mockResolvedValue(ok(packet([])));
	renderScreens(<EditPubkyPkdnsRecords navigation={navigation as never} route={route} />);

	fireEvent.press(await screen.findByTestId('PkdnsRecordDelete-@|A|192.0.2.1|'));
	expect(edit).not.toHaveBeenCalled();
	const confirm = alert.mock.calls[0][2]?.find(button => button.style === 'destructive');
	await act(async () => confirm?.onPress?.());

	expect(edit).toHaveBeenCalledWith('secret', { add: [], remove: [aRecord] }, 'packet');
	expect(screen.queryByTestId('PkdnsRecord-@|A|192.0.2.1|')).toBeNull();
});

it('shows a load error and retries', async () => {
	resolve
		.mockResolvedValueOnce(err('PKDNS_RESOLVE_FAILED: no responses'))
		.mockResolvedValue(ok(packet([aRecord])));
	renderScreens(<EditPubkyPkdnsRecords navigation={navigation as never} route={route} />);

	expect(await screen.findByText('pkdns.errors.resolveFailed')).toBeTruthy();
	expect(screen.getByTestId('PkdnsAddRecordButton')).toBeDisabled();
	await act(async () => fireEvent.press(screen.getByTestId('PkdnsRecordsRetryButton')));

	expect(screen.getByTestId('PkdnsRecord-@|A|192.0.2.1|')).toBeTruthy();
	expect(screen.getByTestId('PkdnsAddRecordButton')).toBeEnabled();
});

it('blocks changes while offline', async () => {
	resolve.mockResolvedValue(ok(packet([aRecord])));
	renderScreens(recordsAndAddForm, { isOnline: false });

	await screen.findByTestId('PkdnsRecord-@|A|192.0.2.1|');
	expect(screen.getAllByText('pkdns.offline')).toHaveLength(2);
	expect(screen.getByTestId('PkdnsAddRecordButton')).toBeDisabled();
	expect(screen.getByTestId('PkdnsRecordDelete-@|A|192.0.2.1|')).toBeDisabled();
	expect(screen.getByTestId('PkdnsAddRecordPublishButton')).toBeDisabled();
});

it('blocks changes when the packet of a pubky with a homeserver is missing', async () => {
	resolve.mockResolvedValue(ok(packet([], false)));
	renderScreens(<EditPubkyPkdnsRecords navigation={navigation as never} route={route} />);

	expect(await screen.findByText('pkdns.errors.notFound')).toBeTruthy();
	expect(screen.getByTestId('PkdnsAddRecordButton')).toBeDisabled();
});

it('offers record management for owned pubkys only', () => {
	const form = { title: 'Edit', loading: false, homeServer: 'hs', needsSignup: false };
	mockForm = { ...form, isExternal: false };
	renderScreens(<EditPubkyMain navigation={navigation as never} route={route} />);
	fireEvent.press(screen.getByTestId('EditPubkyManageRecordsButton'));
	expect(navigation.navigate).toHaveBeenCalledWith('PkdnsRecords', { pubky: 'key' });

	mockForm = { ...form, isExternal: true };
	renderScreens(<EditPubkyMain navigation={navigation as never} route={route} />);
	expect(screen.queryByTestId('EditPubkyManageRecordsButton')).toBeNull();
});
