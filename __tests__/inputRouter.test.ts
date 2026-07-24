import { ok, err } from '@synonymdev/result';
import { EBackupPreference } from '../src/types/pubky';
import {
	actionRequiresNetwork,
	actionRequiresPubky,
	routeInput,
	shouldCloseCameraBeforeRouting,
} from '../src/utils/inputRouter';
import { InputAction, ParsedInput } from '../src/utils/inputParser';
import { handleAuthAction } from '../src/utils/actions/authAction';
import { handleImportAction } from '../src/utils/actions/importAction';
import { handleMigrateAction } from '../src/utils/actions/migrateAction';
import { handleSignupAction } from '../src/utils/actions/signupAction';
import { handleInviteAction } from '../src/utils/actions/inviteAction';
import { handleSessionAction } from '../src/utils/actions/sessionAction';
import { showSheet } from '../src/sheets/sheetNavigation';

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('@synonymdev/react-native-pubky', () => ({
	__esModule: true,
	parseAuthUrl: jest.fn(),
	mnemonicPhraseToKeypair: jest.fn(),
	getPublicKeyFromSecretKey: jest.fn(),
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

const handleAuthActionMock = handleAuthAction as jest.MockedFunction<typeof handleAuthAction>;
const handleImportActionMock = handleImportAction as jest.MockedFunction<typeof handleImportAction>;
const handleMigrateActionMock = handleMigrateAction as jest.MockedFunction<typeof handleMigrateAction>;
const handleSignupActionMock = handleSignupAction as jest.MockedFunction<typeof handleSignupAction>;
const handleInviteActionMock = handleInviteAction as jest.MockedFunction<typeof handleInviteAction>;
const handleSessionActionMock = handleSessionAction as jest.MockedFunction<typeof handleSessionAction>;
const showSheetMock = showSheet as jest.MockedFunction<typeof showSheet>;

const dispatch = jest.fn();

const parsedInput = (data: ParsedInput['data'], source: ParsedInput['source'] = 'scan'): ParsedInput => ({
	action: data.action,
	data,
	source,
	rawInput: `${data.action}:raw`,
});

const resultErrorMessage = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

describe('routeInput', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it.each([
		{
			action: InputAction.Auth,
			data: {
				action: InputAction.Auth,
				params: { relay: 'wss://relay.example.com', secret: 'secret', caps: ['pubky.app:read'] },
				rawUrl: 'pubkyauth:///?secret=secret',
			},
			handler: handleAuthActionMock,
			handlerValue: 'authorized',
			expectedValue: {
				success: true,
				action: InputAction.Auth,
				message: 'authorized',
			},
		},
		{
			action: InputAction.Import,
			data: {
				action: InputAction.Import,
				params: {
					data: 'one two three four five six seven eight nine ten eleven twelve',
					backupPreference: EBackupPreference.recoveryPhrase,
				},
			},
			handler: handleImportActionMock,
			handlerValue: 'pubky-imported',
			expectedValue: {
				success: true,
				action: InputAction.Import,
				pubky: 'pubky-imported',
				message: 'router.importSuccessful',
			},
		},
		{
			action: InputAction.Migrate,
			data: {
				action: InputAction.Migrate,
				params: { index: 1, total: 3, key: 'key-1' },
			},
			handler: handleMigrateActionMock,
			handlerValue: 'pubky-migrated',
			expectedValue: {
				success: true,
				action: InputAction.Migrate,
				pubky: 'pubky-migrated',
				message: 'router.migrateSuccessful',
			},
		},
		{
			action: InputAction.Signup,
			data: {
				action: InputAction.Signup,
				params: {
					homeserver: 'https://homeserver.example.com',
					inviteCode: 'ABCD-1234-WXYZ',
					relay: 'wss://relay.example.com',
					secret: 'secret',
					caps: ['pubky.app:write'],
				},
			},
			handler: handleSignupActionMock,
			handlerValue: 'pubky-signed-up',
			expectedValue: {
				success: true,
				action: InputAction.Signup,
				pubky: 'pubky-signed-up',
				message: 'router.signupSuccessful',
			},
		},
		{
			action: InputAction.Invite,
			data: {
				action: InputAction.Invite,
				params: { inviteCode: 'ABCD-1234-WXYZ' },
			},
			handler: handleInviteActionMock,
			handlerValue: 'pubky-invited',
			expectedValue: {
				success: true,
				action: InputAction.Invite,
				pubky: 'pubky-invited',
				message: 'router.inviteProcessed',
			},
		},
		{
			action: InputAction.Session,
			data: {
				action: InputAction.Session,
				params: { xCallback: { xSuccess: 'bitkit://session' } },
			},
			handler: handleSessionActionMock,
			handlerValue: 'pubky-session',
			expectedValue: {
				success: true,
				action: InputAction.Session,
				pubky: 'pubky-session',
				message: 'router.sessionReturned',
			},
		},
	])('routes $action input to the matching handler', async ({ data, handler, handlerValue, expectedValue }) => {
		handler.mockResolvedValue(ok(handlerValue));
		const parsed = parsedInput(data as ParsedInput['data'], 'deeplink');

		const result = await routeInput(parsed, { dispatch, pubky: 'pubky-selected' });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual(expectedValue);
		}
		expect(handler).toHaveBeenCalledWith(data, {
			dispatch,
			pubky: 'pubky-selected',
			isDeeplink: true,
			setAddPubkyScreen: expect.any(Function),
		});
	});

	it('lets explicit context override the derived deeplink flag', async () => {
		handleImportActionMock.mockResolvedValue(ok('pubky-imported'));
		const parsed = parsedInput(
			{
				action: InputAction.Import,
				params: {
					data: 'secret-key',
					backupPreference: EBackupPreference.encryptedFile,
				},
			},
			'deeplink',
		);

		await routeInput(parsed, { dispatch, isDeeplink: false, skipImportSheet: true });

		expect(handleImportActionMock).toHaveBeenCalledWith(parsed.data, {
			dispatch,
			isDeeplink: false,
			skipImportSheet: true,
			setAddPubkyScreen: expect.any(Function),
		});
	});

	it('uses the Add Pubky sheet as the default screen router', async () => {
		handleInviteActionMock.mockImplementation(async (_data, context) => {
			context.setAddPubkyScreen({ screen: 'ImportOptions' });
			return ok('pubky-invited');
		});
		const parsed = parsedInput({
			action: InputAction.Invite,
			params: { inviteCode: 'ABCD-1234-WXYZ' },
		});

		const result = await routeInput(parsed, { dispatch });

		expect(result.isOk()).toBe(true);
		expect(showSheetMock).toHaveBeenCalledWith('add-pubky', { screen: 'ImportOptions' });
	});

	it('returns handler error messages without wrapping useful errors', async () => {
		handleInviteActionMock.mockResolvedValue(err(new Error('Invite code was already used')));
		const parsed = parsedInput({
			action: InputAction.Invite,
			params: { inviteCode: 'ABCD-1234-WXYZ' },
		});

		const result = await routeInput(parsed, { dispatch });

		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(resultErrorMessage(result.error)).toBe('Invite code was already used');
		}
	});

	it('rejects unknown input without calling action handlers', async () => {
		const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
		const parsed = parsedInput({
			action: InputAction.Unknown,
			params: { rawData: 'not parseable' },
		});

		const result = await routeInput(parsed, { dispatch });

		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(resultErrorMessage(result.error)).toBe('errors.unrecognizedFormat');
		}
		expect(handleAuthActionMock).not.toHaveBeenCalled();
		expect(handleImportActionMock).not.toHaveBeenCalled();
		expect(handleMigrateActionMock).not.toHaveBeenCalled();
		expect(handleSignupActionMock).not.toHaveBeenCalled();
		expect(handleInviteActionMock).not.toHaveBeenCalled();
		expect(handleSessionActionMock).not.toHaveBeenCalled();

		logSpy.mockRestore();
	});
});

describe('input routing helpers', () => {
	it('identifies actions that need selected pubky context', () => {
		expect(actionRequiresPubky(InputAction.Auth)).toBe(true);
		expect(actionRequiresPubky(InputAction.Session)).toBe(true);
		expect(actionRequiresPubky(InputAction.Import)).toBe(false);
	});

	it('identifies actions that need network access', () => {
		expect(actionRequiresNetwork(InputAction.Auth)).toBe(true);
		expect(actionRequiresNetwork(InputAction.Signup)).toBe(true);
		expect(actionRequiresNetwork(InputAction.Invite)).toBe(true);
		expect(actionRequiresNetwork(InputAction.Session)).toBe(true);
		expect(actionRequiresNetwork(InputAction.Import)).toBe(false);
		expect(actionRequiresNetwork(InputAction.Migrate)).toBe(false);
	});

	it('keeps the camera open only for migration frames', () => {
		expect(shouldCloseCameraBeforeRouting(InputAction.Migrate)).toBe(false);
		expect(shouldCloseCameraBeforeRouting(InputAction.Invite)).toBe(true);
	});
});
