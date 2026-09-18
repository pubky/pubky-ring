import React, { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { render, screen, within } from '@testing-library/react-native';
import type { SharedPubkyIdentity } from '../src/utils/sharedPubky';

// A function declaration, so the hoisted module mocks below can call it while this module
// is still initialising.
function mockSharedIdentities(): SharedPubkyIdentity[] {
	return Array.from({ length: 12 }, (_, index) => ({
		version: 1,
		sourceApp: 'to.bitkit',
		pubky: `sharedPubky${index}`,
	}));
}

// Owned pubkys the selector reports; mutable so a test can switch between the two home layouts.
let mockPubkyArray: { key: string; value: unknown }[] = [];

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => jest.fn(),
	useSelector: (selector: (state: unknown) => unknown) => selector({ pubky: { pubkys: {}, processing: {} } }),
	shallowEqual: jest.fn(),
}));

jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({
	__esModule: true,
	getHomeScreenData: () => ({ pubkyArray: mockPubkyArray, hasPubkys: mockPubkyArray.length > 0 }),
}));

jest.mock('../src/store/slices/pubkysSlice.ts', () => ({
	__esModule: true,
	reorderPubkys: (payload: unknown) => ({ type: 'pubky/reorderPubkys', payload }),
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-native-linear-gradient', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return { __esModule: true, default: (props: object) => ReactMock.createElement(View, props) };
});

jest.mock('react-native-draggable-flatlist', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({
			ListHeaderComponent,
			ListFooterComponent,
		}: {
			ListHeaderComponent?: ReactNode;
			ListFooterComponent?: ReactNode;
		}) =>
			ReactMock.createElement(
				View,
				{ testID: 'PubkyList' },
				ReactMock.createElement(View, { testID: 'PubkyListHeader' }, ListHeaderComponent),
				ReactMock.createElement(View, { testID: 'PubkyListFooter' }, ListFooterComponent),
			),
		ScaleDecorator: ({ children }: { children?: ReactNode }) => ReactMock.createElement(View, null, children),
	};
});

jest.mock('../src/components/AppHeader.tsx', () => ({ __esModule: true, HEADER_HEIGHT: 64 }));

jest.mock('../src/components/HomeHeader', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return { __esModule: true, default: () => ReactMock.createElement(View, { testID: 'HomeHeader' }) };
});

jest.mock('../src/components/SafeAreaView.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ children, style }: { children?: ReactNode; style?: object }) =>
			ReactMock.createElement(View, { style }, children),
	};
});

jest.mock('../src/components/SafeAreaInset.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return { __esModule: true, default: () => ReactMock.createElement(View, null) };
});

jest.mock('../src/components/Button', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ testID }: { testID?: string }) => ReactMock.createElement(View, { testID }),
	};
});

jest.mock('../src/components/EmptyState', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return { __esModule: true, default: () => ReactMock.createElement(View, { testID: 'EmptyState' }) };
});

jest.mock('../src/components/PubkyBox.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return { __esModule: true, default: () => ReactMock.createElement(View, null) };
});

jest.mock('../src/components/LegacySunsetBanner.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'LegacySunsetBanner' }),
	};
});

jest.mock('../src/components/SharedPubkyCard.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ identity, index }: { identity: { pubky: string }; index: number }) =>
			ReactMock.createElement(View, { testID: `SharedPubkyCard-${identity.pubky}`, index }),
	};
});

jest.mock('../src/icons/index.ts', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return { __esModule: true, Plus: () => ReactMock.createElement(View, null) };
});

jest.mock('../src/hooks/useReplacementRelease.ts', () => ({
	__esModule: true,
	useReplacementRelease: () => ({ replacementRelease: undefined }),
}));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ __esModule: true, showSheet: jest.fn() }));

jest.mock('../src/hooks/useSharedPubkyDiscovery.ts', () => {
	const ReactMock = require('react');
	const value = { available: true, identities: mockSharedIdentities(), refresh: jest.fn() };

	return {
		__esModule: true,
		SharedPubkyDiscoveryContext: ReactMock.createContext(value),
		useSharedPubkyDiscovery: () => value,
	};
});

import HomeScreen from '../src/screens/HomeScreen';

beforeEach(() => {
	mockPubkyArray = [];
});

test('keeps every discovered identity reachable when Ring has no pubkys of its own', () => {
	render(<HomeScreen />);

	// More identities than fit on screen must stay reachable, so the empty state scrolls.
	const list = screen.UNSAFE_getByType(ScrollView);
	mockSharedIdentities().forEach((identity, index) => {
		const card = within(list).getByTestId(`SharedPubkyCard-${identity.pubky}`);
		expect(card).toBeTruthy();
		// Nothing is above them, so they are numbered from the top of the list.
		expect(card.props.index).toBe(index);
	});
	expect(screen.queryByTestId('EmptyState')).toBeNull();
});

test('lists the unconnected identities below the owned pubkys', () => {
	mockPubkyArray = [
		{ key: 'ownedPubky0', value: {} },
		{ key: 'ownedPubky1', value: {} },
	];

	render(<HomeScreen />);

	const header = screen.getByTestId('PubkyListHeader');
	const footer = screen.getByTestId('PubkyListFooter');
	mockSharedIdentities().forEach((identity, index) => {
		const testID = `SharedPubkyCard-${identity.pubky}`;
		expect(within(header).queryByTestId(testID)).toBeNull();
		// Connecting one appends it after the owned pubkys, so it is numbered from there too.
		expect(within(footer).getByTestId(testID).props.index).toBe(mockPubkyArray.length + index);
	});
});
