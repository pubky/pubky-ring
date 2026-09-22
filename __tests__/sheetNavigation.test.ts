import {
	closeUnavailableSharedPubkySheet,
	navigationRef,
	removeDisconnectedPubkyDetail,
} from '../src/sheets/sheetNavigation';

jest.mock('@react-navigation/native', () => ({
	__esModule: true,
	CommonActions: {
		reset: jest.fn((state: unknown) => ({ type: 'RESET', payload: state })),
	},
	createNavigationContainerRef: jest.fn(() => ({
		isReady: jest.fn(() => true),
		getRootState: jest.fn(),
		dispatch: jest.fn(),
	})),
	StackActions: {
		pop: jest.fn((count: number) => ({ type: 'POP', payload: { count } })),
	},
}));

const navigationRefMock = navigationRef as unknown as {
	isReady: jest.MockedFunction<() => boolean>;
	getRootState: jest.MockedFunction<() => unknown>;
	dispatch: jest.MockedFunction<(action: unknown) => void>;
};

const BORROWED_A = 'borrowedA';
const BORROWED_B = 'borrowedB';

const homeRoute = { key: 'home', name: 'Home' };
const detailRoute = (pubky: string) => ({
	key: `detail-${pubky}`,
	name: 'PubkyDetail',
	params: { pubky, index: 0 },
});

const setRootRoutes = (routes: unknown[], index = routes.length - 1): void => {
	navigationRefMock.getRootState.mockReturnValue({
		stale: false,
		type: 'stack',
		key: 'root',
		index,
		routeNames: routes.map(route => (route as { name: string }).name),
		routes,
	});
};

beforeEach(() => {
	jest.clearAllMocks();
	navigationRefMock.isReady.mockReturnValue(true);
});

test('removes the matching detail beneath an unrelated active sheet without changing the sheet state', () => {
	const sheetRoute = {
		key: 'edit-b',
		name: 'EditPubkySheet',
		params: { pubky: BORROWED_B },
		state: { key: 'nested-sheet', index: 0, routes: [{ key: 'edit-main', name: 'Main' }] },
	};
	setRootRoutes([homeRoute, detailRoute(BORROWED_A), sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.index).toBe(1);
	expect(action.payload.routes).toEqual([homeRoute, sheetRoute]);
	expect(action.payload.routes[1]).toBe(sheetRoute);
});

test('does not alter the stack when the displayed detail belongs to another identity', () => {
	const sheetRoute = {
		key: 'legacy-sheet',
		name: 'LegacySunsetSheet',
		params: { apkUrl: 'https://example.com/app.apk' },
	};
	setRootRoutes([homeRoute, detailRoute(BORROWED_B), sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	expect(navigationRefMock.dispatch).not.toHaveBeenCalled();
});

test('removes stale details beneath Settings while preserving the active route and its nested state', () => {
	const settings = {
		key: 'settings',
		name: 'Settings',
		state: { key: 'settings-stack', index: 0, routes: [{ key: 'preferences', name: 'Preferences' }] },
	};
	const otherDetail = detailRoute(BORROWED_B);
	setRootRoutes([homeRoute, detailRoute(BORROWED_A), otherDetail, settings]);
	removeDisconnectedPubkyDetail(BORROWED_A);
	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.routes).toEqual([homeRoute, otherDetail, settings]);
	expect(action.payload.index).toBe(2);
	expect(action.payload.routes[2]).toBe(settings);
});

test('preserves unrelated routes even when Home is absent from the stack', () => {
	const settings = { key: 'settings', name: 'Settings' };
	setRootRoutes([detailRoute(BORROWED_A), settings]);
	removeDisconnectedPubkyDetail(BORROWED_A);
	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.routes).toEqual([settings]);
	expect(action.payload.index).toBe(0);
});

test('closes only the reuse sheet whose offer disappeared', () => {
	const sheet = {
		key: 'reuse-a',
		name: 'ReuseSharedPubkySheet',
		params: { identity: { pubky: BORROWED_A } },
	};
	setRootRoutes([homeRoute, sheet]);
	closeUnavailableSharedPubkySheet(new Set([BORROWED_A]));
	expect(navigationRefMock.dispatch).not.toHaveBeenCalled();
	closeUnavailableSharedPubkySheet(new Set([BORROWED_B]));
	expect(navigationRefMock.dispatch).toHaveBeenCalledWith({
		type: 'POP',
		payload: { count: 1 },
		target: 'root',
	});
});

test('removes an unavailable reuse sheet without moving the active Settings route', () => {
	const sheet = {
		key: 'reuse-a',
		name: 'ReuseSharedPubkySheet',
		params: { identity: { pubky: BORROWED_A } },
	};
	const settings = { key: 'settings', name: 'Settings' };
	const about = { key: 'about', name: 'About' };
	setRootRoutes([homeRoute, sheet, settings, about], 2);
	closeUnavailableSharedPubkySheet(new Set());
	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.routes).toEqual([homeRoute, settings, about]);
	expect(action.payload.index).toBe(1);
	expect(action.payload.routes[1]).toBe(settings);
});

test('does not close an unrelated sheet when an offer disappears', () => {
	setRootRoutes([homeRoute, { key: 'add', name: 'AddPubkySheet' }]);
	closeUnavailableSharedPubkySheet(new Set());
	expect(navigationRefMock.dispatch).not.toHaveBeenCalled();
});

test('closes an active sheet tied to the disconnected detail identity', () => {
	const sheetRoute = {
		key: 'edit-a',
		name: 'EditPubkySheet',
		params: { pubky: BORROWED_A },
	};
	setRootRoutes([homeRoute, detailRoute(BORROWED_A), sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.index).toBe(0);
	expect(action.payload.routes).toEqual([homeRoute]);
});

test('closes a nested auth sheet tied to the disconnected detail identity', () => {
	const sheetRoute = {
		key: 'auth-a',
		name: 'AuthSheet',
		params: {
			screen: 'SelectPubky',
			params: { deepLink: 'pubkyauth://example', source: 'scan' },
		},
		state: {
			key: 'auth-stack',
			index: 1,
			routes: [
				{ key: 'select', name: 'SelectPubky' },
				{ key: 'confirm', name: 'ConfirmAuth', params: { pubky: BORROWED_A } },
			],
		},
	};
	setRootRoutes([homeRoute, detailRoute(BORROWED_A), sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.index).toBe(0);
	expect(action.payload.routes).toEqual([homeRoute]);
});

test('keeps an auth sheet when only an inactive nested route belongs to the disconnected identity', () => {
	const sheetRoute = {
		key: 'auth-b',
		name: 'AuthSheet',
		state: {
			key: 'auth-stack',
			index: 1,
			routes: [
				{ key: 'confirm-a', name: 'ConfirmAuth', params: { pubky: BORROWED_A } },
				{ key: 'confirm-b', name: 'ConfirmAuth', params: { pubky: BORROWED_B } },
			],
		},
	};
	setRootRoutes([homeRoute, sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	expect(navigationRefMock.dispatch).not.toHaveBeenCalled();
});

test('closes a matching identity sheet over Home without removing Home', () => {
	const sheetRoute = {
		key: 'edit-a',
		name: 'EditPubkySheet',
		params: { pubky: BORROWED_A },
	};
	setRootRoutes([homeRoute, sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.index).toBe(0);
	expect(action.payload.routes).toEqual([homeRoute]);
});

test('closes a matching identity sheet without removing another identity detail', () => {
	const otherDetailRoute = detailRoute(BORROWED_B);
	const sheetRoute = {
		key: 'edit-a',
		name: 'EditPubkySheet',
		params: { pubky: BORROWED_A },
	};
	setRootRoutes([homeRoute, otherDetailRoute, sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	const action = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(action.payload.index).toBe(1);
	expect(action.payload.routes).toEqual([homeRoute, otherDetailRoute]);
});

test('removes a second identity sheet after an earlier disconnect removed the underlying detail', () => {
	const sheetRoute = {
		key: 'edit-b',
		name: 'EditPubkySheet',
		params: { pubky: BORROWED_B },
	};
	setRootRoutes([homeRoute, detailRoute(BORROWED_A), sheetRoute]);

	removeDisconnectedPubkyDetail(BORROWED_A);

	const firstAction = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(firstAction.payload.index).toBe(1);
	expect(firstAction.payload.routes).toEqual([homeRoute, sheetRoute]);
	navigationRefMock.getRootState.mockReturnValue(firstAction.payload);
	navigationRefMock.dispatch.mockClear();

	removeDisconnectedPubkyDetail(BORROWED_B);

	const secondAction = navigationRefMock.dispatch.mock.calls[0][0] as {
		payload: { index: number; routes: unknown[] };
	};
	expect(secondAction.payload.index).toBe(0);
	expect(secondAction.payload.routes).toEqual([homeRoute]);
});
