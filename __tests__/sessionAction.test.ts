import { ok, err } from '@synonymdev/result';
import { InputAction } from '../src/utils/inputParser';
import {
	executeSessionAction,
	handleSessionAction,
	type SessionActionData,
} from '../src/utils/actions/sessionAction';
import { signInToHomeserver } from '../src/utils/pubky';
import { showSheet } from '../src/sheets/sheetNavigation';
import { openXError, openXSuccessWithParams } from '../src/utils/xCallback';

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

jest.mock('@synonymdev/react-native-pubky', () => ({
	__esModule: true,
	parseAuthUrl: jest.fn(),
	mnemonicPhraseToKeypair: jest.fn(),
	getPublicKeyFromSecretKey: jest.fn(),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	showSheet: jest.fn(),
}));

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	signInToHomeserver: jest.fn(),
}));

jest.mock('../src/utils/xCallback', () => ({
	__esModule: true,
	hasValidSessionCallbacks: jest.fn(xCallback => {
		const isValid = (url?: string): boolean => Boolean(url?.match(/^[A-Za-z][A-Za-z0-9+.-]*:\/\//));
		return isValid(xCallback?.xSuccess) && [xCallback?.xError, xCallback?.xCancel].every(
			(url?: string) => url === undefined || isValid(url),
		);
	}),
	openXError: jest.fn(),
	openXSuccessWithParams: jest.fn(),
}));

const signInToHomeserverMock = signInToHomeserver as jest.MockedFunction<typeof signInToHomeserver>;
const showSheetMock = showSheet as jest.MockedFunction<typeof showSheet>;
const openXSuccessWithParamsMock = openXSuccessWithParams as jest.MockedFunction<
	typeof openXSuccessWithParams
>;
const openXErrorMock = openXError as jest.MockedFunction<typeof openXError>;

const dispatch = jest.fn();
const sessionData: SessionActionData = {
	action: InputAction.Session,
	params: {
		xCallback: {
			xSuccess: 'bitkit://session/return',
			xError: 'bitkit://session/error',
			xCancel: 'bitkit://session/cancel',
			xSource: 'Bitkit',
		},
	},
};

describe('session actions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signInToHomeserverMock.mockResolvedValue(
			ok({
				pubky: 'pubky-selected',
				session_secret: 'pubky-selected:session-cookie',
				capabilities: ['/', '/pub'],
			}),
		);
	});

	it('opens confirmation instead of signing in immediately', async () => {
		const result = await handleSessionAction(sessionData, { dispatch, pubky: 'pubky-selected' });

		expect(result.isOk()).toBe(true);
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(openXSuccessWithParamsMock).not.toHaveBeenCalled();
		expect(showSheetMock).toHaveBeenCalledWith('auth', {
			screen: 'ConfirmSession',
			params: {
				pubky: 'pubky-selected',
				xCallback: sessionData.params.xCallback,
			},
		});
	});

	it('allows web callback URLs to be confirmed by the user', async () => {
		const webSessionData: SessionActionData = {
			action: InputAction.Session,
			params: { xCallback: { xSuccess: 'https://webhook.site/session' } },
		};

		const result = await handleSessionAction(webSessionData, { dispatch, pubky: 'pubky-selected' });

		expect(result.isOk()).toBe(true);
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(openXSuccessWithParamsMock).not.toHaveBeenCalled();
		expect(showSheetMock).toHaveBeenCalledWith('auth', {
			screen: 'ConfirmSession',
			params: {
				pubky: 'pubky-selected',
				xCallback: webSessionData.params.xCallback,
			},
		});
	});

	it('rejects malformed callback URLs before confirmation', async () => {
		const result = await handleSessionAction(
			{
				action: InputAction.Session,
				params: { xCallback: { xSuccess: 'webhook.site/session' } },
			},
			{ dispatch, pubky: 'pubky-selected' },
		);

		expect(result.isErr()).toBe(true);
		expect(showSheetMock).not.toHaveBeenCalled();
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(openXSuccessWithParamsMock).not.toHaveBeenCalled();
	});

	it('returns the session secret only after explicit approval', async () => {
		const result = await executeSessionAction(sessionData, { dispatch, pubky: 'pubky-selected' });

		expect(result.isOk()).toBe(true);
		expect(signInToHomeserverMock).toHaveBeenCalledWith({
			pubky: 'pubky-selected',
			dispatch,
		});
		expect(openXSuccessWithParamsMock).toHaveBeenCalledWith(sessionData.params.xCallback, {
			pubky: 'pubky-selected',
			session_secret: 'pubky-selected:session-cookie',
			capabilities: '/,/pub',
		});
	});

	it('sends approved sign-in failures to the allowed error callback', async () => {
		signInToHomeserverMock.mockResolvedValueOnce(err(new Error('homeserver unavailable')));

		const result = await executeSessionAction(sessionData, { dispatch, pubky: 'pubky-selected' });

		expect(result.isErr()).toBe(true);
		expect(openXErrorMock).toHaveBeenCalledWith(
			sessionData.params.xCallback,
			'SESSION_FAILED',
			'homeserver unavailable',
		);
	});
});
