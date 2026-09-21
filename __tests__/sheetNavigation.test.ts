import { navigationRef, removeDisconnectedPubkyDetail } from '../src/sheets/sheetNavigation';

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
