import { Platform } from 'react-native';

// HEADER_HEIGHT lives in AppHeader.tsx, which pulls in the full header component
// tree (icons, styled-components, ...). Mock it down to just the constant so this
// test stays focused on the detent math.
jest.mock('../src/components/AppHeader.tsx', () => ({ HEADER_HEIGHT: 56 }));

// getSheetDetent branches on isSmallScreen(); force the "regular" (non-small)
// screen path so we exercise the ratio calculation.
jest.mock('../src/utils/helpers.ts', () => ({ isSmallScreen: () => false }));

import { getSheetDetent } from '../src/sheets/sheetLayout.ts';

/**
 * react-native-screens requires a single formSheet detent to satisfy
 * `detent in 0.0..1.0` (see SheetDetents.kt). A value > 1.0 throws
 * IllegalArgumentException natively and the sheet fails to present.
 *
 * Regression for https://github.com/pubky/pubky-ring/issues/359
 * "Add pubky button is broken" — the sheet does not display on Android
 * devices with a tall navigation bar (e.g. Mi Note 11 / MIUI 3-button nav).
 */
describe('getSheetDetent (Android)', () => {
	const originalOS = Platform.OS;

	beforeAll(() => {
		Platform.OS = 'android';
	});

	afterAll(() => {
		Platform.OS = originalOS;
	});

	it('stays within react-native-screens allowed range (0, 1] for a tall bottom-inset device', () => {
		// Realistic Mi Note 11 / MIUI 3-button-nav metrics (in dp).
		const windowHeight = 851;
		const topInset = 28;
		const bottomInset = 56;

		const detent = getSheetDetent(windowHeight, topInset, bottomInset);

		expect(detent).toBeGreaterThan(0);
		// This currently FAILS: the detent is ~1.006, which react-native-screens
		// rejects, so the Add-pubky sheet never appears.
		expect(detent).toBeLessThanOrEqual(1);
	});

	it('stays within range for a small gesture-nav inset (regression guard)', () => {
		const detent = getSheetDetent(851, 28, 24);
		expect(detent).toBeGreaterThan(0);
		expect(detent).toBeLessThanOrEqual(1);
	});
});
