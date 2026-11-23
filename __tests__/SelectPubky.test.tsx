import React from 'react';
import { render } from '@testing-library/react-native';
import SelectPubky from '../src/screens/SelectPubky';

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		SheetScreen: ({ children }: { children?: React.ReactNode }) =>
			ReactMock.createElement(View, null, children),
	};
});

jest.mock('../src/components/Button.tsx', () => ({ __esModule: true, default: () => null }));

jest.mock('../src/components/PubkyCard.tsx', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');

	return {
		__esModule: true,
		default: ({ name }: { name?: string }) =>
			ReactMock.createElement(Text, { testID: 'PubkyCardName' }, name),
	};
});

jest.mock('@shopify/flash-list', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		FlashList: ({
			data,
			renderItem,
		}: {
			data: Array<unknown>;
			renderItem: (info: { item: unknown; index: number }) => React.ReactElement;
		}) =>
			ReactMock.createElement(
				View,
				null,
				data.map((item, index) => renderItem({ item, index })),
			),
	};
});

jest.mock('../src/theme/typography.ts', () => ({ __esModule: true, TextBaseM: () => null }));

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => jest.fn(),
	useSelector: () => ({
		named: { name: 'Work', signedUp: true },
		unnamed: { name: '', signedUp: true },
	}),
}));

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));
jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ hideSheet: jest.fn() }));
jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({ getAuthorizablePubkys: jest.fn() }));
jest.mock('../src/store/slices/pubkysSlice.ts', () => ({ setDeepLink: jest.fn() }));
jest.mock('../src/utils/inputParser', () => ({ InputAction: {}, parseInput: jest.fn() }));
jest.mock('../src/utils/actions/authAction.ts', () => ({ createConfirmAuthPayload: jest.fn() }));
jest.mock('../src/utils/store-helpers.ts', () => ({ getAutoAuthFromStore: jest.fn() }));
jest.mock('../src/utils/inputHandlerUtils.ts', () => ({ routeInputWithContext: jest.fn() }));

describe('SelectPubky', () => {
	it('shows each pubky by its name, with the placeholder for one without a name', () => {
		const { getAllByTestId } = render(
			<SelectPubky route={{ params: { deepLink: '', source: 'scan' } } as never} navigation={{} as never} />,
		);

		expect(getAllByTestId('PubkyCardName').map(name => name.props.children)).toEqual(['Work', 'pubky']);
	});
});
