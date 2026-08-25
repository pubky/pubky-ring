import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AddPubkyImportSuccess from '../src/screens/AddPubkyImportSuccess';
import { resetRootToHome, resetRootToHomeWithSheet } from '../src/sheets/sheetNavigation';

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		SheetScreen: ({ children }: { children?: React.ReactNode }) =>
			ReactMock.createElement(View, null, children),
	};
});

jest.mock('../src/components/Button.tsx', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');

	return {
		__esModule: true,
		default: ({ onPress, testID, text }: { onPress: () => void; testID?: string; text: string }) =>
			ReactMock.createElement(
				Pressable,
				{ onPress, testID },
				ReactMock.createElement(Text, null, text),
			),
	};
});

jest.mock('../src/components/PubkyProfile.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'PubkyProfile' }),
	};
});

jest.mock('../src/components/PubkyCard.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'PubkyCard' }),
	};
});

jest.mock('../src/theme/typography.ts', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');

	return {
		__esModule: true,
		TextBaseM: ({ children }: { children?: React.ReactNode }) =>
			ReactMock.createElement(Text, null, children),
	};
});

jest.mock('react-redux', () => ({
	__esModule: true,
	useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({
	__esModule: true,
	getAllPubkys: jest.fn(() => ({})),
	getPubky: jest.fn(() => undefined),
	getPubkyCount: jest.fn(() => 1),
}));

jest.mock('../src/hooks/usePubkyHandlers.ts', () => ({
	__esModule: true,
	usePubkyHandlers: () => ({
		onPubkyPress: jest.fn(),
	}),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	hideSheet: jest.fn(),
	resetRootToHome: jest.fn(),
	resetRootToHomeWithSheet: jest.fn(),
}));

const resetRootToHomeMock = resetRootToHome as jest.MockedFunction<typeof resetRootToHome>;
const resetRootToHomeWithSheetMock = resetRootToHomeWithSheet as jest.MockedFunction<
	typeof resetRootToHomeWithSheet
>;

describe('AddPubkyImportSuccess', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns Home with the edit sheet for new imports', () => {
		const pubky = 'pubky-new';
		const { getByTestId } = render(
			<AddPubkyImportSuccess
				route={{ params: { pubky, isNewPubky: true } } as never}
				navigation={{} as never}
			/>,
		);

		fireEvent.press(getByTestId('ImportSuccessButton'));

		expect(resetRootToHomeWithSheetMock).toHaveBeenCalledWith('edit-pubky', { pubky });
		expect(resetRootToHomeMock).not.toHaveBeenCalled();
	});

	it('returns Home for migration imports', () => {
		const { getByTestId } = render(
			<AddPubkyImportSuccess
				route={
					{
						params: {
							isMigration: true,
							pubkys: ['pubky-one'],
							totalCount: 1,
						},
					} as never
				}
				navigation={{} as never}
			/>,
		);

		fireEvent.press(getByTestId('ImportSuccessButton'));

		expect(resetRootToHomeMock).toHaveBeenCalled();
		expect(resetRootToHomeWithSheetMock).not.toHaveBeenCalled();
	});
});
