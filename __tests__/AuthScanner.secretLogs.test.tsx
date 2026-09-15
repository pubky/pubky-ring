import React from 'react';
import { act, render } from '@testing-library/react-native';
import { err } from '@synonymdev/result';
import AuthScanner from '../src/screens/AuthScanner';
import { InputAction } from '../src/utils/inputParser';
import { parseInput } from '../src/utils/inputParser';
import { routeInput } from '../src/utils/inputRouter';
import { getIsOnline } from '../src/utils/store-helpers';

let mockScannerProps: {
	onScan: (data: string) => Promise<void> | void;
	onCopyClipboard: () => Promise<void>;
};

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		SheetScreen: ({ children }: { children?: React.ReactNode }) =>
			ReactMock.createElement(View, null, children),
	};
});

jest.mock('../src/components/QRScannerContent.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: (props: typeof mockScannerProps) => {
			mockScannerProps = props;
			return ReactMock.createElement(View, { testID: 'QRScannerContent' });
		},
	};
});

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => jest.fn(),
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/utils/clipboard', () => ({
	__esModule: true,
	readFromClipboard: jest.fn(),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('../src/utils/helpers', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getAutoAuthFromStore: jest.fn(() => false),
	getIsOnline: jest.fn(() => true),
}));

jest.mock('../src/utils/actions/authAction', () => ({
	__esModule: true,
	createConfirmAuthPayload: jest.fn(),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	hideSheet: jest.fn(),
}));

jest.mock('../src/utils/inputParser', () => ({
	__esModule: true,
	InputAction: {
		Auth: 'auth',
		Import: 'import',
		Migrate: 'migrate',
		Signup: 'signup',
		DirectSignup: 'direct_signup',
		Invite: 'invite',
		Session: 'session',
		HomeserverSignIn: 'homeserver_signin',
		Unknown: 'unknown',
	},
	parseInput: jest.fn(),
}));

jest.mock('../src/utils/inputRouter', () => ({
	__esModule: true,
	actionRequiresNetwork: jest.fn(() => false),
	routeInput: jest.fn(),
}));

const parseInputMock = parseInput as jest.MockedFunction<typeof parseInput>;
const routeInputMock = routeInput as jest.MockedFunction<typeof routeInput>;
const getIsOnlineMock = getIsOnline as jest.MockedFunction<typeof getIsOnline>;

const BIP39_TEST_MNEMONIC =
	'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('AuthScanner R1 logs', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		getIsOnlineMock.mockReturnValue(true);
	});

	it('does not log scanned rawInput when routing fails', async () => {
		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const rawInput = `pubkyring://migrate?index=1&total=1&key=${encodeURIComponent(BIP39_TEST_MNEMONIC)}`;
		parseInputMock.mockResolvedValue({
			action: InputAction.Migrate,
			data: {
				action: InputAction.Migrate,
				params: { index: 1, total: 1, key: BIP39_TEST_MNEMONIC },
			},
			source: 'scan',
			rawInput,
		} as never);
		routeInputMock.mockResolvedValue(err(new Error('Invalid migration parameters')));

		render(
			<AuthScanner
				navigation={{ navigate: jest.fn() } as never}
				route={{ params: { pubky: 'test-pubky' } } as never}
			/>,
		);

		await act(async () => {
			await mockScannerProps.onScan(rawInput);
		});

		const logged = errorSpy.mock.calls.flat().map(String).join('\n');
		expect(logged).toContain('Auth scanner route error:');
		expect(logged).not.toContain(BIP39_TEST_MNEMONIC);
		expect(logged).not.toContain(rawInput);
		errorSpy.mockRestore();
	});
});
