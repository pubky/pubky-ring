import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SheetScreen } from '../src/components/Sheet';

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ goBack: jest.fn() }),
	useIsFocused: () => true,
	useNavigationState: (selector: (state: unknown) => unknown) =>
		selector({ routeNames: ['ConfirmAuth'], index: 0 }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ hideActiveSheet: jest.fn() }));
jest.mock('../src/components/AppHeader.tsx', () => ({ HEADER_HEIGHT: 56 }));
jest.mock('../src/components/SafeAreaInset.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/LinearGradient.tsx', () => ({
	LinearGradient: require('react-native').View,
	RadialGradient: require('react-native').View,
}));
jest.mock('../src/theme/typography.ts', () => ({ TextLgSb: require('react-native').Text }));
jest.mock('../src/theme/components.ts', () => ({ ThemedView: require('react-native').View }));
jest.mock('../src/icons/index.ts', () => ({ ArrowLeft: () => null }));

it('runs the sheet back action only after a completed press', () => {
	const onBackPress = jest.fn();
	render(
		<SheetScreen id="auth" title="Authorize" onBackPress={onBackPress}>
			{null}
		</SheetScreen>,
	);
	const backButton = screen.getByTestId('auth-back-button');

	fireEvent(backButton, 'pressIn');
	expect(onBackPress).not.toHaveBeenCalled();
	fireEvent(backButton, 'pressOut');
	expect(onBackPress).not.toHaveBeenCalled();

	fireEvent.press(backButton);
	expect(onBackPress).toHaveBeenCalledTimes(1);
});
