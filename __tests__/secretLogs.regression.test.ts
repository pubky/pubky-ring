import { err } from '@synonymdev/result';
import { InputAction, ParsedInput } from '../src/utils/inputParser';
import { routeInput } from '../src/utils/inputRouter';
import { routeInputWithContext } from '../src/utils/inputHandlerUtils';
import { handleSessionAction } from '../src/utils/actions/sessionAction';
import { handleAuthAction } from '../src/utils/actions/authAction';
import { handleImportAction } from '../src/utils/actions/importAction';
import { handleMigrateAction } from '../src/utils/actions/migrateAction';
import { handleDirectSignupAction, handleSignupAction } from '../src/utils/actions/signupAction';
import { handleInviteAction } from '../src/utils/actions/inviteAction';

jest.mock('@synonymdev/react-native-pubky');

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/utils/errorHandler', () => ({
	__esModule: true,
	getErrorMessage: (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) return error.message;
		if (typeof error === 'string' && error) return error;
		return fallback;
	},
}));

jest.mock('../src/utils/actions/authAction', () => ({
	__esModule: true,
	handleAuthAction: jest.fn(),
}));

jest.mock('../src/utils/actions/importAction', () => ({
	__esModule: true,
	handleImportAction: jest.fn(),
}));

jest.mock('../src/utils/actions/migrateAction', () => ({
	__esModule: true,
	handleMigrateAction: jest.fn(),
}));

jest.mock('../src/utils/actions/signupAction', () => ({
	__esModule: true,
	handleSignupAction: jest.fn(),
	handleDirectSignupAction: jest.fn(),
}));

jest.mock('../src/utils/actions/inviteAction', () => ({
	__esModule: true,
	handleInviteAction: jest.fn(),
}));

jest.mock('../src/utils/actions/sessionAction', () => ({
	__esModule: true,
	handleSessionAction: jest.fn(),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	showSheet: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	setDeepLink: jest.fn((payload: string) => ({ type: 'pubky/setDeepLink', payload })),
}));

const handleMigrateActionMock = handleMigrateAction as jest.MockedFunction<typeof handleMigrateAction>;
const handleImportActionMock = handleImportAction as jest.MockedFunction<typeof handleImportAction>;
const handleAuthActionMock = handleAuthAction as jest.MockedFunction<typeof handleAuthAction>;
const handleSignupActionMock = handleSignupAction as jest.MockedFunction<typeof handleSignupAction>;
const handleDirectSignupActionMock = handleDirectSignupAction as jest.MockedFunction<
	typeof handleDirectSignupAction
>;
const handleInviteActionMock = handleInviteAction as jest.MockedFunction<typeof handleInviteAction>;
const handleSessionActionMock = handleSessionAction as jest.MockedFunction<typeof handleSessionAction>;

const dispatch = jest.fn();

const BIP39_TEST_MNEMONIC =
	'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const SYNTHETIC_SECRET_HEX = '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc1';

describe('R1 secret logs', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not log migrate rawInput or key material when routing fails', async () => {
		handleMigrateActionMock.mockResolvedValue(err(new Error('Invalid migration parameters')));
		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const parsed: ParsedInput = {
			action: InputAction.Migrate,
			data: {
				action: InputAction.Migrate,
				params: { index: 1, total: 1, key: BIP39_TEST_MNEMONIC },
			},
			source: 'deeplink',
			rawInput: `pubkyring://migrate?index=1&total=1&key=${encodeURIComponent(BIP39_TEST_MNEMONIC)}`,
		};

		await routeInputWithContext(parsed, undefined, 'deeplink', dispatch);

		const logged = errorSpy.mock.calls.flat().map(String).join('\n');
		expect(logged).toContain('Input routing error:');
		expect(logged).not.toContain(BIP39_TEST_MNEMONIC);
		expect(logged).not.toContain('rawInput');
		errorSpy.mockRestore();
	});

	it('does not log unknown hex or mnemonic payloads', async () => {
		const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

		const parsed: ParsedInput = {
			action: InputAction.Unknown,
			data: {
				action: InputAction.Unknown,
				params: { rawData: SYNTHETIC_SECRET_HEX },
			},
			source: 'scan',
			rawInput: SYNTHETIC_SECRET_HEX,
		};

		await routeInput(parsed, { dispatch });

		const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls].flat().map(String).join('\n');
		expect(logged).not.toContain(SYNTHETIC_SECRET_HEX);
		expect(handleImportActionMock).not.toHaveBeenCalled();
		expect(handleAuthActionMock).not.toHaveBeenCalled();
		expect(handleSignupActionMock).not.toHaveBeenCalled();
		expect(handleDirectSignupActionMock).not.toHaveBeenCalled();
		expect(handleInviteActionMock).not.toHaveBeenCalled();
		expect(handleSessionActionMock).not.toHaveBeenCalled();
		logSpy.mockRestore();
		errorSpy.mockRestore();
	});
});
