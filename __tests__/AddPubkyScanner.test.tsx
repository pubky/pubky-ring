import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ok } from '@synonymdev/result';
import AddPubkyScanner from '../src/screens/AddPubkyScanner';
import { InputAction } from '../src/utils/inputParser';
import { parseInput } from '../src/utils/inputParser';
import { routeInput } from '../src/utils/inputRouter';
import { showToast } from '@synonymdev/react-native-toast';
import { resetMigrateAccumulator } from '../src/utils/actions/migrateAction';

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

jest.mock('@react-navigation/native', () => ({
	__esModule: true,
	StackActions: {
		replace: jest.fn((screen: string, params: unknown) => ({ type: 'replace', payload: { screen, params } })),
	},
}));

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
	routeInput: jest.fn(),
}));

jest.mock('../src/utils/actions/migrateAction', () => ({
	__esModule: true,
	handleMigrationScannerClose: jest.fn(),
	resetMigrateAccumulator: jest.fn(),
}));

const parseInputMock = parseInput as jest.MockedFunction<typeof parseInput>;
const routeInputMock = routeInput as jest.MockedFunction<typeof routeInput>;
const showToastMock = showToast as jest.MockedFunction<typeof showToast>;
const resetMigrateAccumulatorMock = resetMigrateAccumulator as jest.MockedFunction<
	typeof resetMigrateAccumulator
>;

describe('AddPubkyScanner', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		routeInputMock.mockResolvedValue(ok({ success: true, action: InputAction.Migrate }));
	});

	it('routes migration QR frames from import mode', async () => {
		const navigation = {
			dispatch: jest.fn(),
		};
		const parsed = {
			action: InputAction.Migrate,
			data: {
				action: InputAction.Migrate,
				params: { index: 0, total: 2, key: 'encrypted-secret-key' },
			},
			source: 'scan',
			rawInput: 'pubkyring://migrate?index=0&total=2&key=encrypted-secret-key',
		} as const;
		parseInputMock.mockResolvedValue(parsed);

		render(<AddPubkyScanner navigation={navigation as never} route={{ params: { mode: 'import' } } as never} />);

		await act(async () => {
			await mockScannerProps.onScan(parsed.rawInput);
		});

		expect(resetMigrateAccumulatorMock).toHaveBeenCalled();
		expect(routeInputMock).toHaveBeenCalledWith(parsed, {
			dispatch: expect.any(Function),
			setAddPubkyScreen: expect.any(Function),
		});
		expect(showToastMock).not.toHaveBeenCalled();
	});
});
