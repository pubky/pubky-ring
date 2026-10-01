import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PubkyDetail } from '../src/components/PubkyDetail/PubkyDetail';
import { EBackupPreference } from '../src/types/pubky';

jest.mock('../src/components/PubkyDetail/PubkyDetailCard.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'PubkyDetailCard' }),
	};
});

jest.mock('../src/components/PubkyDetail/AuthorizedGrantList.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'AuthorizedGrantList' }),
	};
});

jest.mock('../src/components/SafeAreaInset.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: () => ReactMock.createElement(View, { testID: 'BottomSafeAreaInset' }),
	};
});

jest.mock('../src/components/AppHeader.tsx', () => ({
	__esModule: true,
	HEADER_HEIGHT: 56,
}));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({
	__esModule: true,
	showSheet: jest.fn(),
}));

jest.mock('../src/utils/sheetHelpers.ts', () => ({
	__esModule: true,
	showBackupSheet: jest.fn(),
}));

jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({
	__esModule: true,
	canPubkyAuthorize: ({ signedUp, sourceApp }: { signedUp: boolean; sourceApp?: string }) =>
		signedUp || !!sourceApp,
}));

const pubkyData = {
	pubky: 'test-pubky',
	name: 'Test Pubky',
	homeserver: '',
	signedUp: false,
	signupToken: '',
	image: '',
	sessions: [],
	backupPreference: EBackupPreference.unknown,
	isBackedUp: false,
};

describe('PubkyDetail', () => {
	it('hides authorized apps when the pubky is not configured', () => {
		render(<PubkyDetail index={0} pubkyData={pubkyData} onQRPress={jest.fn()} />);

		expect(screen.queryByTestId('AuthorizedGrantList')).toBeNull();
		expect(screen.getByTestId('BottomSafeAreaInset')).toBeTruthy();
	});

	it('shows authorized apps when the pubky is configured', () => {
		render(
			<PubkyDetail
				index={0}
				pubkyData={{ ...pubkyData, homeserver: 'https://homeserver.example', signedUp: true }}
				onQRPress={jest.fn()}
			/>,
		);

		expect(screen.getByTestId('AuthorizedGrantList')).toBeTruthy();
	});
});
