import { getAutoAuth, getNavigationAnimation } from '../src/store/selectors/settingsSelectors';
import { initialState as settings } from '../src/store/shapes/settings';
import { initialState as pubky } from '../src/store/shapes/pubky';
import { initialState as ui } from '../src/store/shapes/ui';
import type { RootState } from '../src/types';
import { ENavigationAnimation } from '../src/types/settings';

// React Native's export condition selects Immer's untransformed ESM build in Jest.
jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));

describe('getAutoAuth', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([
		[true, true, true],
		[true, false, false],
		[false, true, false],
		[false, false, false],
	])('with __DEV__=%s and persisted autoAuth=%s returns %s', (isDev, autoAuth, expected) => {
		jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', isDev);
		const state: RootState = {
			settings: { ...settings, autoAuth },
			pubky,
			ui,
			authorizedGrants: { byPubky: {} },
		};

		expect(getAutoAuth(state)).toBe(expected);
	});
});

describe('getNavigationAnimation', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each<[boolean, ENavigationAnimation, ENavigationAnimation]>([
		[true, ENavigationAnimation.fade, ENavigationAnimation.fade],
		[true, ENavigationAnimation.slideFromRight, ENavigationAnimation.slideFromRight],
		[false, ENavigationAnimation.fade, ENavigationAnimation.slideFromRight],
		[false, ENavigationAnimation.slideFromRight, ENavigationAnimation.slideFromRight],
	])(
		'with __DEV__=%s and persisted navigationAnimation=%s returns %s',
		(isDev, navigationAnimation, expected) => {
			jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', isDev);
			const state: RootState = {
				settings: { ...settings, navigationAnimation },
				pubky,
				ui,
				authorizedGrants: { byPubky: {} },
			};

			expect(getNavigationAnimation(state)).toBe(expected);
		},
	);
});
