import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AddPubkyImportSuccess from '../src/screens/AddPubkyImportSuccess';
import { resetRootToHome, resetRootToHomeWithSheet } from '../src/sheets/sheetNavigation';
import { getAllPubkys, getPubky } from '../src/store/selectors/pubkySelectors.ts';

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
			ReactMock.createElement(Pressable, { onPress, testID }, ReactMock.createElement(Text, null, text)),
	};
});

jest.mock('../src/components/PubkyProfile.tsx', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');

	return {
		__esModule: true,
		default: ({ pubkyData }: { pubkyData: { name: string } }) =>
			ReactMock.createElement(Text, { testID: 'PubkyProfile' }, pubkyData.name),
	};
});

jest.mock('../src/components/PubkyCard.tsx', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');

	return {
		__esModule: true,
		default: ({ name }: { name: string }) => ReactMock.createElement(Text, { testID: 'PubkyCard' }, name),
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

	it('shows the stored names of migrated pubkys, not their position in the batch', () => {
		(getAllPubkys as jest.Mock).mockReturnValue({
			'pubky-existing': { name: 'pubky #1' },
			'pubky-two': { name: 'pubky #3' },
			'pubky-one': { name: 'pubky #2' },
		});
		const { getAllByTestId } = render(
			<AddPubkyImportSuccess
				route={{ params: { isMigration: true, pubkys: ['pubky-one', 'pubky-two'], totalCount: 2 } } as never}
				navigation={{} as never}
			/>,
		);

		expect(getAllByTestId('PubkyCard').map(card => card.props.children)).toEqual(['pubky #2', 'pubky #3']);
		(getAllPubkys as jest.Mock).mockReturnValue({});
	});

	it('shows the stored name of a single imported pubky', () => {
		(getPubky as jest.Mock).mockReturnValue({ name: 'pubky #4' });
		const { getByTestId } = render(
			<AddPubkyImportSuccess
				route={{ params: { pubky: 'pubky-new', isNewPubky: true } } as never}
				navigation={{} as never}
			/>,
		);

		expect(getByTestId('PubkyProfile')).toHaveTextContent('pubky #4');
		(getPubky as jest.Mock).mockReturnValue(undefined);
	});
});
