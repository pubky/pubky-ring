import { navigationRef, openHomeserverSettings } from '../src/sheets/sheetNavigation';

jest.mock('@react-navigation/native', () => ({
	createNavigationContainerRef: () => ({ isReady: jest.fn(), getRootState: jest.fn(), dispatch: jest.fn() }),
	CommonActions: { reset: (payload: unknown) => ({ type: 'RESET', payload }) },
	StackActions: { pop: jest.fn() },
}));
const ready = navigationRef.isReady as jest.Mock;
const getState = navigationRef.getRootState as jest.Mock;
const dispatch = navigationRef.dispatch as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	ready.mockReturnValue(true);
});

it('removes the modal sheet and opens Homeservers in the normal Settings hierarchy', () => {
	const home = { key: 'home', name: 'Home' };
	const detail = { key: 'detail', name: 'PubkyDetail', params: { pubky: 'key', index: 0 } };
	const state = { key: 'root', index: 2, routes: [home, detail, { key: 'edit', name: 'EditPubkySheet' }] };
	getState.mockReturnValue(state);
	openHomeserverSettings();
	expect(dispatch).toHaveBeenCalledWith({
		type: 'RESET',
		target: 'root',
		payload: {
			...state,
			index: 3,
			routes: [home, detail, { name: 'Settings' }, { name: 'Homeservers' }],
		},
	});
});

it('reuses an existing Settings screen without retaining sheets or duplicating management screens', () => {
	const home = { key: 'home', name: 'Home' };
	const settings = { key: 'settings', name: 'Settings' };
	const state = {
		key: 'root',
		index: 4,
		routes: [
			home,
			settings,
			{ key: 'servers', name: 'Homeservers' },
			{ key: 'form', name: 'HomeserverForm' },
			{ key: 'edit', name: 'EditPubkySheet' },
		],
	};
	getState.mockReturnValue(state);
	openHomeserverSettings();
	expect(dispatch).toHaveBeenCalledWith({
		type: 'RESET',
		target: 'root',
		payload: {
			...state,
			index: 2,
			routes: [home, settings, { name: 'Homeservers' }],
		},
	});
});

it('does not dispatch before navigation is ready', () => {
	ready.mockReturnValue(false);
	openHomeserverSettings();
	expect(dispatch).not.toHaveBeenCalled();
});
