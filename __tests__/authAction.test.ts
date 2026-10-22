import { ok, err } from '@synonymdev/result';
import { parseDeepLink } from '@synonymdev/react-native-pubky';
import { createConfirmAuthPayload, handleAuthAction } from '../src/utils/actions/authAction';
import { getAutoAuth } from '../src/store/selectors/settingsSelectors';
import { initialState as settings } from '../src/store/shapes/settings';
import { initialState as pubky } from '../src/store/shapes/pubky';
import { initialState as ui } from '../src/store/shapes/ui';
import { getAutoAuthFromStore } from '../src/utils/store-helpers';
import { performAuth } from '../src/utils/pubky';
import { showSheet } from '../src/sheets/sheetNavigation';
import { syncAuthorizedGrantsAfterAuth } from '../src/utils/authorizedGrants';
import type { RootState } from '../src/types';

// React Native's export condition selects Immer's untransformed ESM build in Jest.
jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));

jest.mock('../src/utils/authorizedGrants.ts', () => ({
	refreshAuthorizedGrants: jest.fn(),
	refreshAuthorizedGrantsAfterAuthorization: jest.fn(),
	syncAuthorizedGrantsAfterAuth: jest.fn(),
}));
import { InputAction } from '../src/utils/inputParser';

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

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({
	__esModule: true,
	showSheet: jest.fn(),
}));

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	performAuth: jest.fn(),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getAuthorizedGrantCountFromStore: jest.fn(() => 0),
	getAutoAuthFromStore: jest.fn(() => false),
}));

jest.mock('../src/utils/xCallback', () => ({
	__esModule: true,
	openXSuccess: jest.fn(),
	openXError: jest.fn(),
}));

const parseDeepLinkMock = parseDeepLink as jest.MockedFunction<typeof parseDeepLink>;

describe('handleAuthAction Auto Auth', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([
		[true, 'rw'],
		[true, 'rwe'],
		[false, 'rw'],
		[false, 'rwe'],
	])('respects the build gate with saved Auto Auth enabled (__DEV__=%s, :%s)', async (isDev, permission) => {
		jest.replaceProperty(global as typeof global & { __DEV__: boolean }, '__DEV__', isDev);
		const state: RootState = {
			settings: { ...settings, autoAuth: true },
			pubky,
			ui,
			authorizedGrants: { byPubky: {} },
		};
		jest.mocked(getAutoAuthFromStore).mockImplementation(() => getAutoAuth(state));
		jest.mocked(performAuth).mockResolvedValue(ok('success'));
		jest.mocked(syncAuthorizedGrantsAfterAuth).mockResolvedValue(undefined);
		const rawUrl = `pubkyauth://signin_grant?caps=%2Fpriv%2Fexample.app%2F%3A${permission}&relay=https%3A%2F%2Frelay.example.com%2Finbox&secret=auth-secret&cid=example.app&cpk=client-pubky`;
		const authDetails = {
			scheme: 'pubkyauth',
			kind: 'signin_grant',
			url: rawUrl,
			relay: 'https://relay.example.com/inbox',
			secret: 'auth-secret',
			client_id: 'example.app',
			client_public_key: 'client-pubky',
			capabilities: [{ path: '/priv/example.app/', permission }],
		} as const;
		parseDeepLinkMock.mockResolvedValueOnce(
			ok({ ...authDetails, capabilities: [...authDetails.capabilities] }),
		);
		const dispatch = jest.fn();

		const result = await handleAuthAction(
			{
				action: InputAction.Auth,
				params: {
					kind: 'signin_grant',
					relay: authDetails.relay,
					secret: authDetails.secret,
					caps: [`/priv/example.app/:${permission}`],
				},
				rawUrl,
			},
			{ pubky: 'selected-pubky', dispatch },
		);

		expect(result.isOk()).toBe(true);
		if (isDev) {
			expect(performAuth).toHaveBeenCalledWith({ pubky: 'selected-pubky', authUrl: rawUrl, dispatch });
			expect(showSheet).not.toHaveBeenCalled();
		} else {
			expect(performAuth).not.toHaveBeenCalled();
			expect(syncAuthorizedGrantsAfterAuth).not.toHaveBeenCalled();
			expect(showSheet).toHaveBeenCalledWith('auth', {
				screen: 'ConfirmAuth',
				params: expect.objectContaining({
					pubky: 'selected-pubky',
					authUrl: rawUrl,
					authDetails,
				}),
			});
		}
	});
});

describe('createConfirmAuthPayload', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('parses grant auth URLs with the Pubky deeplink parser', async () => {
		const xCallback = { xSuccess: 'bitkit://auth/success' };
		parseDeepLinkMock.mockResolvedValueOnce(
			ok({
				scheme: 'pubkyauth',
				kind: 'signin_grant',
				url: 'pubkyauth://signin_grant?secret=auth-secret',
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				client_id: 'pubky.app',
				client_public_key: 'client-pubky',
				capabilities: [{ path: '/pub/pubky.app/session.json', permission: 'write' }],
				x_success: xCallback.xSuccess,
			}),
		);

		const result = await createConfirmAuthPayload({
			pubky: 'pubky-selected',
			data: {
				action: InputAction.Auth,
				params: {
					relay: 'wss://relay.example.com',
					secret: 'auth-secret',
					kind: 'signin_grant',
					caps: ['/pub/pubky.app/session.json:write'],
					xCallback,
				},
				rawUrl: 'pubkyauth://signin_grant?secret=auth-secret',
			},
		});

		expect(parseDeepLinkMock).toHaveBeenCalledWith('pubkyauth://signin_grant?secret=auth-secret');
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.authDetails).toMatchObject({
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				kind: 'signin_grant',
				capabilities: [{ path: '/pub/pubky.app/session.json', permission: 'write' }],
				client_id: 'pubky.app',
				client_public_key: 'client-pubky',
				x_success: xCallback.xSuccess,
			});
			expect(result.value.xCallback).toBe(xCallback);
		}
	});

	it('accepts signed grant auth URLs without a legacy relay secret', async () => {
		const rawUrl =
			'pubkyauth://signin_grant?caps=%2Fpriv%2Fexample.app%2F%3Arwe&relay=https%3A%2F%2Fhttprelay.pubky.app%2Finbox&cid=example.app&cpk=client-pubky&af=v1&epk=ephemeral-public-key';
		parseDeepLinkMock.mockResolvedValueOnce(
			ok({
				scheme: 'pubkyauth',
				kind: 'signin_grant',
				url: rawUrl,
				relay: 'https://httprelay.pubky.app/inbox',
				client_id: 'example.app',
				client_public_key: 'client-pubky',
				approval_format: 'signed_approval_v1',
				ephemeral_public_key: 'ephemeral-public-key',
				capabilities: [{ path: '/priv/example.app/', permission: 'rwe' }],
			}),
		);

		const result = await createConfirmAuthPayload({
			pubky: 'pubky-selected',
			data: {
				action: InputAction.Auth,
				params: {
					relay: 'https://httprelay.pubky.app/inbox',
					kind: 'signin_grant',
					caps: ['/priv/example.app/:rwe'],
				},
				rawUrl,
			},
		});

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.authDetails).toMatchObject({
				approval_format: 'signed_approval_v1',
				ephemeral_public_key: 'ephemeral-public-key',
			});
			expect(result.value.authDetails.secret).toBeUndefined();
		}
	});

	it('rejects non-auth deeplinks', async () => {
		parseDeepLinkMock.mockResolvedValueOnce(
			ok({
				scheme: 'pubkyring',
				kind: 'secret_export',
				url: 'pubkyring://secret_export?secret=secret-value',
				secret: 'secret-value',
			}),
		);

		const result = await createConfirmAuthPayload({
			pubky: 'pubky-selected',
			data: {
				action: InputAction.Auth,
				params: {
					relay: 'wss://relay.example.com',
					secret: 'auth-secret',
					caps: [],
				},
				rawUrl: 'pubkyring://secret_export?secret=secret-value',
			},
		});

		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(result.error.message).toBe('errors.failedToParseAuth');
		}
	});

	it('returns parser errors', async () => {
		parseDeepLinkMock.mockResolvedValueOnce(err('bad auth url'));

		const result = await createConfirmAuthPayload({
			pubky: 'pubky-selected',
			data: {
				action: InputAction.Auth,
				params: {
					relay: 'wss://relay.example.com',
					secret: 'auth-secret',
					caps: [],
				},
				rawUrl: 'not-auth',
			},
		});

		expect(result.isErr()).toBe(true);
		if (result.isErr()) {
			expect(result.error.message).toBe('bad auth url');
		}
	});
});
