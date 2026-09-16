jest.mock('@react-navigation/native', () => ({
	CommonActions: { reset: jest.fn() },
	StackActions: { pop: jest.fn() },
	createNavigationContainerRef: () => ({
		addListener: jest.fn(() => jest.fn()),
		dispatch: jest.fn(),
		getRootState: jest.fn(),
		isReady: jest.fn(() => false),
	}),
}));

import {
	beginSheetWork,
	isSheetNavigationResetError,
	resetSheetNavigationState,
	showSheet,
} from '../src/sheets/sheetNavigation';

afterEach(() => {
	resetSheetNavigationState();
});

test('waits for active sheet work before completing a navigation reset', async () => {
	const finishSheetWork = beginSheetWork('auth');
	const completion = showSheet('auth', {
		screen: 'SelectPubky',
		params: {
			deepLink: 'pubkyauth:///?secret=redacted',
			source: 'deeplink',
		},
	});
	const outcome = completion.then(
		() => 'resolved' as const,
		error => error,
	);

	resetSheetNavigationState();
	let settled = false;
	outcome.finally(() => {
		settled = true;
	});
	await Promise.resolve();

	expect(settled).toBe(false);

	finishSheetWork();
	const error = await outcome;
	expect(isSheetNavigationResetError(error)).toBe(true);
});
