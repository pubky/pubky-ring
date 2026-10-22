import React from 'react';
import { Image } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AppHeader from '../src/components/AppHeader';
import HomeHeader from '../src/components/HomeHeader';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

jest.mock('../src/navigation/hooks.ts', () => ({
	useTypedNavigation: () => mockNavigation,
}));

jest.mock('react-native-linear-gradient', () => ({
	__esModule: true,
	default: require('react-native').View,
}));

jest.mock('../src/theme/typography', () => ({
	Text2Xl: require('react-native').Text,
}));

jest.mock('../src/icons/index.ts', () => ({
	ArrowLeft: () => null,
	Gear: () => null,
	Info: () => null,
}));

describe('AppHeader', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([true, false])('keeps the logo visible without a double-tap shortcut (__DEV__=%s)', isDev => {
		jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', isDev);
		render(<AppHeader />);
		const logo = screen.UNSAFE_getByType(Image);
		expect(logo.props.source).toBe(require('../src/images/pubky-ring-logo.png'));

		fireEvent.press(logo);
		fireEvent.press(logo);

		expect(mockNavigation.navigate).not.toHaveBeenCalled();
	});

	it('retains back navigation', () => {
		render(<AppHeader />);
		fireEvent(screen.getByTestId('AppHeaderBackButton'), 'pressIn');

		expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
	});

	it('opens Settings normally from the home settings button', () => {
		render(<HomeHeader />);
		fireEvent(screen.getByTestId('HomeHeaderSettingsButton'), 'pressIn');

		expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings');
	});
});
