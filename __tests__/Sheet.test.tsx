import React from 'react';
import { BackHandler, View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SheetScreen } from '../src/components/Sheet.tsx';

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();
const mockRemoveBackHandler = jest.fn();
let mockHardwareBackPress: ((event: unknown) => boolean | null | undefined) | undefined;

jest.mock('@react-navigation/native', () => ({
	useIsFocused: () => true,
	useNavigation: () => ({
		goBack: mockGoBack,
		setOptions: mockSetOptions,
	}),
	useNavigationState: (selector: (state: { routeNames: string[]; index: number }) => unknown) =>
		selector({ routeNames: ['Scanner', 'ConfirmAuth'], index: 1 }),
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../src/components/SafeAreaInset.tsx', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../src/components/LinearGradient.tsx', () => {
	const ReactMock = require('react');
	const { View: MockView } = require('react-native');

	return {
		LinearGradient: ({ children }: { children?: React.ReactNode }) =>
			ReactMock.createElement(MockView, null, children),
		RadialGradient: () => null,
	};
});

jest.mock('../src/theme/typography.ts', () => {
	const ReactMock = require('react');
	const { View: MockView } = require('react-native');

	return {
		TextLgSb: ({ children, testID }: { children?: React.ReactNode; testID?: string }) =>
			ReactMock.createElement(MockView, { testID }, children),
	};
});

jest.mock('../src/components/HeaderNavButton.tsx', () => {
	const ReactMock = require('react');
	const { Pressable: MockPressable } = require('react-native');

	return {
		__esModule: true,
		default: (props: Record<string, unknown>) => ReactMock.createElement(MockPressable, props),
	};
});

jest.mock('../src/icons/index.ts', () => ({
	ArrowLeft: () => null,
}));

jest.mock('../src/components/AppHeader.tsx', () => ({
	HEADER_HEIGHT: 64,
}));

jest.mock('../src/sheets/sheetLayout.ts', () => ({
	getSheetContentHeight: () => 640,
}));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({
	hideActiveSheet: jest.fn(),
}));

jest.mock('../src/sheets/sheetPlatform.ts', () => ({
	shouldUseAndroidSheetFallback: () => false,
}));

jest.mock('../src/theme/components.ts', () => {
	const { View: MockView } = require('react-native');
	return { ThemedView: MockView };
});

beforeEach(() => {
	mockGoBack.mockClear();
	mockSetOptions.mockClear();
	mockRemoveBackHandler.mockClear();
	mockHardwareBackPress = undefined;
	jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_eventName, handler) => {
		mockHardwareBackPress = handler as (event: unknown) => boolean | null | undefined;
		return { remove: mockRemoveBackHandler };
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

test('blocks nested back navigation while confirmation work is active', async () => {
	const view = render(
		<SheetScreen id="auth" title="Confirm" preventBackNavigation>
			<View />
		</SheetScreen>,
	);

	await waitFor(() => expect(mockSetOptions).toHaveBeenCalledWith({ gestureEnabled: false }));
	expect(screen.queryByTestId('auth-back-button')).toBeNull();
	expect(mockHardwareBackPress?.({})).toBe(true);

	view.rerender(
		<SheetScreen id="auth" title="Confirm" preventBackNavigation={false}>
			<View />
		</SheetScreen>,
	);

	await waitFor(() => expect(mockSetOptions).toHaveBeenCalledWith({ gestureEnabled: true }));
	fireEvent(screen.getByTestId('auth-back-button'), 'pressIn');
	expect(mockGoBack).toHaveBeenCalledTimes(1);
	expect(mockHardwareBackPress?.({})).toBe(false);
});
