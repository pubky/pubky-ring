import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render, waitFor } from '@testing-library/react-native';
import { useDeepLinkHandler } from '../src/hooks/useDeepLinkHandler';
import pubkyReducer, { queueDeepLink } from '../src/store/slices/pubkysSlice';

const mockRouteInputWithContext = jest.fn();
const mockActionRequiresPubky = jest.fn<boolean, [unknown]>(() => false);
const mockShowAuthPubkySelection = jest.fn<Promise<void>, []>();
const mockWaitForPendingSheetNavigation = jest.fn<Promise<void>, []>();
const mockSignedUpPubkys = { first: {}, second: {} };

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('react-redux', () => jest.requireActual('../node_modules/react-redux/dist/cjs/index.js'));
jest.mock('../src/sheets/sheetNavigation', () => ({
	isSheetNavigationResetError: (error: unknown) =>
		error instanceof Error && error.name === 'SheetNavigationResetError',
	waitForPendingSheetNavigation: () => mockWaitForPendingSheetNavigation(),
}));

jest.mock('../src/store/selectors/pubkySelectors', () => ({
	getAllPubkys: (state: { pubky: { pubkys: Record<string, unknown> } }) => state.pubky.pubkys,
	getDeepLink: (state: { pubky: { deepLink: string } }) => state.pubky.deepLink,
	getDeepLinkQueue: (state: { pubky: { deepLinkQueue: unknown[] } }) => state.pubky.deepLinkQueue,
	getSignedUpPubkys: () => mockSignedUpPubkys,
}));

jest.mock('../src/utils/inputRouter', () => ({
	actionRequiresPubky: (action: unknown) => mockActionRequiresPubky(action),
}));

jest.mock('../src/utils/inputHandlerUtils', () => ({
	handleNoPubkysAvailable: jest.fn(),
	routeInputWithContext: (...args: unknown[]) => mockRouteInputWithContext(...args),
	showAuthPubkySelection: () => mockShowAuthPubkySelection(),
}));

const DEEP_LINK = JSON.stringify({ action: 'test', data: {}, rawInput: 'pubkyring://example' });

const HookHarness = (): null => {
	useDeepLinkHandler();
	return null;
};

beforeEach(() => {
	mockActionRequiresPubky.mockReset().mockReturnValue(false);
	mockRouteInputWithContext.mockReset().mockResolvedValue(undefined);
	mockShowAuthPubkySelection.mockReset().mockResolvedValue(undefined);
	mockWaitForPendingSheetNavigation.mockReset().mockResolvedValue(undefined);
});

test('waits for an existing sheet flow before routing the first queued delivery', async () => {
	let closeExistingSheet: () => void = () => {};
	mockWaitForPendingSheetNavigation.mockImplementationOnce(
		() =>
			new Promise<void>(resolve => {
				closeExistingSheet = resolve;
			}),
	);

	const store = configureStore({ reducer: { pubky: pubkyReducer } });
	const root = render(
		<Provider store={store}>
			<HookHarness />
		</Provider>,
	);

	act(() => {
		store.dispatch(queueDeepLink(DEEP_LINK));
	});
	await waitFor(() => expect(mockWaitForPendingSheetNavigation).toHaveBeenCalledTimes(1));
	expect(mockRouteInputWithContext).not.toHaveBeenCalled();

	await act(async () => closeExistingSheet());
	await waitFor(() => expect(mockRouteInputWithContext).toHaveBeenCalledTimes(1));
	await waitFor(() => expect(store.getState().pubky.deepLinkQueue).toEqual([]));
	root.unmount();
});

test('routes repeated queued deliveries in order across a root remount', async () => {
	let resolveFirstRoute: () => void = () => {};
	mockRouteInputWithContext
		.mockImplementationOnce(
			() =>
				new Promise<void>(resolve => {
					resolveFirstRoute = resolve;
				}),
		)
		.mockResolvedValueOnce(undefined);

	const store = configureStore({ reducer: { pubky: pubkyReducer } });
	const firstRoot = render(
		<Provider store={store}>
			<HookHarness />
		</Provider>,
	);

	act(() => {
		store.dispatch(queueDeepLink(DEEP_LINK));
		store.dispatch(queueDeepLink(DEEP_LINK));
	});
	await waitFor(() => expect(mockRouteInputWithContext).toHaveBeenCalledTimes(1));
	firstRoot.unmount();

	const secondRoot = render(
		<Provider store={store}>
			<HookHarness />
		</Provider>,
	);
	await act(async () => {});
	expect(mockRouteInputWithContext).toHaveBeenCalledTimes(1);

	await act(async () => resolveFirstRoute());
	await waitFor(() => expect(mockRouteInputWithContext).toHaveBeenCalledTimes(2));
	await waitFor(() => expect(store.getState().pubky.deepLinkQueue).toEqual([]));
	secondRoot.unmount();
});

test('waits for the current confirmation flow before routing the next delivery', async () => {
	let closeFirstSheet: () => void = () => {};
	mockActionRequiresPubky.mockReturnValue(true);
	mockShowAuthPubkySelection
		.mockImplementationOnce(
			() =>
				new Promise<void>(resolve => {
					closeFirstSheet = resolve;
				}),
		)
		.mockResolvedValueOnce(undefined);

	const store = configureStore({ reducer: { pubky: pubkyReducer } });
	const root = render(
		<Provider store={store}>
			<HookHarness />
		</Provider>,
	);

	act(() => {
		store.dispatch(queueDeepLink(DEEP_LINK));
		store.dispatch(queueDeepLink(DEEP_LINK));
	});
	await waitFor(() => expect(mockShowAuthPubkySelection).toHaveBeenCalledTimes(1));

	await act(async () => closeFirstSheet());
	await waitFor(() => expect(mockShowAuthPubkySelection).toHaveBeenCalledTimes(2));
	await waitFor(() => expect(store.getState().pubky.deepLinkQueue).toEqual([]));
	root.unmount();
});

test('does not replay a presented confirmation after sheet navigation resets', async () => {
	mockActionRequiresPubky.mockReturnValue(true);
	const resetError = new Error('Sheet navigation was reset');
	resetError.name = 'SheetNavigationResetError';
	mockShowAuthPubkySelection.mockRejectedValueOnce(resetError);

	const store = configureStore({ reducer: { pubky: pubkyReducer } });
	const root = render(
		<Provider store={store}>
			<HookHarness />
		</Provider>,
	);

	act(() => {
		store.dispatch(queueDeepLink(DEEP_LINK));
	});
	await waitFor(() => expect(mockShowAuthPubkySelection).toHaveBeenCalledTimes(1));
	await waitFor(() => expect(store.getState().pubky.deepLinkQueue).toEqual([]));
	root.unmount();
});
