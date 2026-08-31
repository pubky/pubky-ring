import { InputAction, parseInput } from '../src/utils/inputParser';
import { EBackupPreference } from '../src/types/pubky';
import { ok, err } from '@synonymdev/result';
import * as Pubky from '@synonymdev/react-native-pubky';
import type { PubkyDeepLinkDetails } from '@synonymdev/react-native-pubky';

jest.mock('@synonymdev/react-native-pubky');

const parseDeepLinkMock = Pubky.parseDeepLink as jest.MockedFunction<typeof Pubky.parseDeepLink>;
const mnemonicPhraseToKeypairMock = Pubky.mnemonicPhraseToKeypair as jest.MockedFunction<
	typeof Pubky.mnemonicPhraseToKeypair
>;
const getPublicKeyFromSecretKeyMock = Pubky.getPublicKeyFromSecretKey as jest.MockedFunction<
	typeof Pubky.getPublicKeyFromSecretKey
>;
const homeserverPubkey = '8um71us3fyw6h8wbcxb5ar3rwusy1a6u49956ikzojg3gcwd1dty';
const mockDeepLink = (details: PubkyDeepLinkDetails): void => {
	parseDeepLinkMock.mockResolvedValue(ok(details));
};

describe('parseInput', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		parseDeepLinkMock.mockResolvedValue(err('not a deeplink'));
		mnemonicPhraseToKeypairMock.mockResolvedValue(err('not a mnemonic'));
		getPublicKeyFromSecretKeyMock.mockResolvedValue(err('not a secret key'));
	});

	it('preserves nested x-callback URLs when parsing session deeplinks', async () => {
		const xSuccess = 'bitkit://wallet/callback?nonce=abc123&state=ready';
		const xError = 'bitkit://wallet/error?nonce=abc123&reason=denied';
		const rawInput =
			`pubkyring://session?x-success=${encodeURIComponent(xSuccess)}` +
			`&x-error=${encodeURIComponent(xError)}` +
			'&x-source=Bitkit';

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Session);
		expect(parsed.data).toEqual({
			action: InputAction.Session,
			params: {
				xCallback: {
					xSuccess,
					xError,
					xCancel: undefined,
					xSource: 'Bitkit',
				},
			},
		});
	});

	it('extracts invite codes from URLs without losing x-callback parameters', async () => {
		const xSuccess = 'pubky://invite/accepted?token=abc&next=home';
		const rawInput = `https://example.com/invite/ABCD-1234-WXYZ?x-success=${encodeURIComponent(xSuccess)}`;

		const parsed = await parseInput(rawInput, 'scan');

		expect(parsed.action).toBe(InputAction.Invite);
		expect(parsed.data).toEqual({
			action: InputAction.Invite,
			params: {
				inviteCode: 'ABCD-1234-WXYZ',
				xCallback: {
					xSuccess,
					xError: undefined,
					xCancel: undefined,
					xSource: undefined,
				},
			},
		});
		expect(parseDeepLinkMock).toHaveBeenCalledWith(
			'https://example.com/invite/ABCD-1234-WXYZ?x-success=pubky://invite/accepted?token=abc&next=home',
		);
	});

	it('parses standalone invite codes', async () => {
		const parsed = await parseInput('ABCD-1234-WXYZ', 'clipboard');

		expect(parsed).toMatchObject({
			action: InputAction.Invite,
			data: {
				action: InputAction.Invite,
				params: {
					inviteCode: 'ABCD-1234-WXYZ',
				},
			},
			source: 'clipboard',
			rawInput: 'ABCD-1234-WXYZ',
		});
		expect(parseDeepLinkMock).toHaveBeenCalledWith('ABCD-1234-WXYZ');
	});

	it('parses pubkyring invite deeplinks', async () => {
		const rawInput = 'pubkyring://invite/AZ3B-1D37-3SA0';
		const parsed = await parseInput(rawInput, 'clipboard');

		expect(parsed).toMatchObject({
			action: InputAction.Invite,
			data: {
				action: InputAction.Invite,
				params: {
					inviteCode: 'AZ3B-1D37-3SA0',
				},
			},
			source: 'clipboard',
			rawInput,
		});
		expect(parseDeepLinkMock).toHaveBeenCalledWith(rawInput);
	});

	it('parses migration deeplinks before stripping protocols', async () => {
		const parsed = await parseInput('pubkyring://migrate/?index=2&total=5&key=pubky-key-2', 'scan');

		expect(parsed).toEqual({
			action: InputAction.Migrate,
			data: {
				action: InputAction.Migrate,
				params: {
					index: 2,
					total: 5,
					key: 'pubky-key-2',
				},
			},
			source: 'scan',
			rawInput: 'pubkyring://migrate/?index=2&total=5&key=pubky-key-2',
		});
	});

	it('parses signup deeplinks with decoded fields, caps, and callbacks', async () => {
		const xSuccess = 'bitkit://signup/success?nonce=abc&next=home';
		const rawInput =
			'pubkyring://signup?' +
			`hs=${homeserverPubkey}` +
			'&st=ABCD-1234-WXYZ' +
			`&relay=${encodeURIComponent('wss://relay.example.com')}` +
			'&secret=secret-value' +
			'&caps=pubky.app:read,pubky.app:write' +
			`&x-success=${encodeURIComponent(xSuccess)}` +
			'&x-source=Bitkit';
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'signup',
			url: rawInput.replace('pubkyring://', 'pubkyauth://'),
			homeserver: homeserverPubkey,
			signup_token: 'ABCD-1234-WXYZ',
			relay: 'wss://relay.example.com',
			secret: 'secret-value',
			capabilities: [
				{ path: 'pubky.app', permission: 'read' },
				{ path: 'pubky.app', permission: 'write' },
			],
			x_success: xSuccess,
			x_source: 'Bitkit',
		});

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parseDeepLinkMock).toHaveBeenCalledWith(expect.stringContaining('pubkyauth://signup?'));
		expect(parsed.action).toBe(InputAction.Signup);
		expect(parsed.data).toEqual({
			action: InputAction.Signup,
			params: {
				homeserver: homeserverPubkey,
				inviteCode: 'ABCD-1234-WXYZ',
				relay: 'wss://relay.example.com',
				secret: 'secret-value',
				caps: ['pubky.app:read', 'pubky.app:write'],
				kind: 'signup',
				xCallback: {
					xSuccess,
					xError: undefined,
					xCancel: undefined,
					xSource: 'Bitkit',
				},
			},
		});
	});

	it('preserves signup grant auth intent from the Pubky deeplink parser', async () => {
		const rawInput =
			'pubkyauth://signup_grant?' +
			`hs=${homeserverPubkey}` +
			`&relay=${encodeURIComponent('wss://relay.example.com')}` +
			'&secret=secret-value' +
			'&caps=pubky.app:write';
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'signup_grant',
			url: rawInput,
			homeserver: homeserverPubkey,
			relay: 'wss://relay.example.com',
			secret: 'secret-value',
			capabilities: [{ path: 'pubky.app', permission: 'write' }],
		});

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Signup);
		expect(parsed.data).toEqual({
			action: InputAction.Signup,
			params: {
				homeserver: homeserverPubkey,
				inviteCode: '',
				relay: 'wss://relay.example.com',
				secret: 'secret-value',
				caps: ['pubky.app:write'],
				kind: 'signup_grant',
				xCallback: undefined,
			},
		});
	});

	it('parses direct signup deeplinks without auth parameters', async () => {
		const rawInput =
			'pubkyauth://direct_signup?' +
			`hs=${homeserverPubkey}` +
			'&st=ABCD-1234-WXYZ';
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'direct_signup',
			url: rawInput,
			homeserver: homeserverPubkey,
			signup_token: 'ABCD-1234-WXYZ',
		});

		const parsed = await parseInput(rawInput, 'scan');

		expect(parsed.action).toBe(InputAction.DirectSignup);
		expect(parsed.data).toEqual({
			action: InputAction.DirectSignup,
			params: {
				homeserver: homeserverPubkey,
				inviteCode: 'ABCD-1234-WXYZ',
				xCallback: undefined,
			},
		});
	});

	it('parses direct signup deeplinks without signup tokens', async () => {
		const rawInput = `pubkyauth://direct_signup?hs=${homeserverPubkey}`;
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'direct_signup',
			url: rawInput,
			homeserver: homeserverPubkey,
		});

		const parsed = await parseInput(rawInput, 'scan');

		expect(parsed.action).toBe(InputAction.DirectSignup);
		expect(parsed.data).toEqual({
			action: InputAction.DirectSignup,
			params: {
				homeserver: homeserverPubkey,
				inviteCode: '',
				xCallback: undefined,
			},
		});
	});

	it('routes signup deeplinks without auth parameters when accepted by Pubky parser', async () => {
		const rawInput = `pubkyauth://signup?hs=${homeserverPubkey}&st=ABCD-1234-WXYZ`;
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'signup',
			url: rawInput,
			homeserver: homeserverPubkey,
			signup_token: 'ABCD-1234-WXYZ',
		});

		const parsed = await parseInput(rawInput, 'scan');

		expect(parsed.action).toBe(InputAction.DirectSignup);
		expect(parsed.data).toEqual({
			action: InputAction.DirectSignup,
			params: {
				homeserver: homeserverPubkey,
				inviteCode: 'ABCD-1234-WXYZ',
				xCallback: undefined,
			},
		});
	});

	it('parses signin deeplinks through the Pubky deeplink parser', async () => {
		const xCancel = 'bitkit://auth/cancel?nonce=abc&reason=user';
		mockDeepLink({
			scheme: 'pubkyauth',
			relay: 'wss://relay.example.com',
			secret: 'auth-secret',
			kind: 'signin',
			url: 'pubkyauth://signin?caps=ignored-by-mock',
			capabilities: [
				{ path: '/pub/pubky.app/profile.json', permission: 'read' },
				{ path: '/pub/pubky.app/session.json', permission: 'write' },
			],
			x_cancel: xCancel,
		});
		const rawInput =
			'pubkyring://signin?' +
			'caps=ignored-by-mock' +
			'&secret=auth-secret' +
			`&relay=${encodeURIComponent('wss://relay.example.com')}` +
			`&x-cancel=${encodeURIComponent(xCancel)}`;

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parseDeepLinkMock).toHaveBeenCalledWith(expect.stringContaining('pubkyauth://signin?'));
		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data).toEqual({
			action: InputAction.Auth,
			params: {
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				kind: 'signin',
				homeserver: undefined,
				signupToken: undefined,
				caps: ['/pub/pubky.app/profile.json:read', '/pub/pubky.app/session.json:write'],
				xCallback: {
					xSuccess: undefined,
					xError: undefined,
					xCancel,
					xSource: undefined,
				},
			},
			rawUrl: expect.stringContaining('pubkyauth://signin?'),
		});
	});

	it('preserves grant auth intent from the Pubky deeplink parser', async () => {
		mockDeepLink({
			scheme: 'pubkyauth',
			relay: 'wss://relay.example.com',
			secret: 'auth-secret',
			kind: 'signin_grant',
			url: 'pubkyauth://signin_grant?caps=ignored-by-mock',
			capabilities: [{ path: '/pub/pubky.app/session.json', permission: 'write' }],
		});

		const rawInput =
			'pubkyauth://signin_grant?caps=ignored-by-mock&secret=auth-secret&relay=wss://relay.example.com';

		const parsed = await parseInput(rawInput, 'scan');

		expect(parseDeepLinkMock).toHaveBeenCalledWith(rawInput);
		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data).toEqual({
			action: InputAction.Auth,
			params: {
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				kind: 'signin_grant',
				homeserver: undefined,
				signupToken: undefined,
				caps: ['/pub/pubky.app/session.json:write'],
				xCallback: undefined,
			},
			rawUrl: rawInput,
		});
	});

	it('parses grant auth deeplinks through the Pubky deeplink parser', async () => {
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'signin_grant',
			url: 'pubkyauth://signin_grant?caps=ignored-by-mock',
			relay: 'wss://relay.example.com',
			secret: 'auth-secret',
			client_id: 'pubky.app',
			client_public_key: 'client-pubky',
			capabilities: [{ path: '/pub/pubky.app/session.json', permission: 'write' }],
		});

		const rawInput =
			'pubkyauth://signin_grant?caps=ignored-by-mock&secret=auth-secret&relay=wss://relay.example.com';

		const parsed = await parseInput(rawInput, 'scan');

		expect(parseDeepLinkMock).toHaveBeenCalledWith(rawInput);
		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data).toEqual({
			action: InputAction.Auth,
			params: {
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				kind: 'signin_grant',
				homeserver: undefined,
				signupToken: undefined,
				caps: ['/pub/pubky.app/session.json:write'],
				xCallback: undefined,
			},
			rawUrl: rawInput,
		});
	});

	it('parses direct signup deeplinks through the Pubky deeplink parser', async () => {
		mockDeepLink({
			scheme: 'pubkyauth',
			kind: 'direct_signup',
			url: `pubkyauth://direct_signup?hs=${homeserverPubkey}&st=ABCD-1234-WXYZ`,
			homeserver: homeserverPubkey,
			signup_token: 'ABCD-1234-WXYZ',
		});

		const rawInput = `pubkyauth://direct_signup?hs=${homeserverPubkey}&st=ABCD-1234-WXYZ`;

		const parsed = await parseInput(rawInput, 'scan');

		expect(parseDeepLinkMock).toHaveBeenCalledWith(rawInput);
		expect(parsed.action).toBe(InputAction.DirectSignup);
		expect(parsed.data).toEqual({
			action: InputAction.DirectSignup,
			params: {
				homeserver: homeserverPubkey,
				inviteCode: 'ABCD-1234-WXYZ',
				xCallback: undefined,
			},
		});
	});

	it('parses secret export deeplinks through the Pubky deeplink parser', async () => {
		mockDeepLink({
			scheme: 'pubkyring',
			kind: 'secret_export',
			url: 'pubkyring://secret_export?secret=secret-value',
			secret: 'secret-value',
		});

		const rawInput = 'pubkyring://secret_export?secret=secret-value';

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed).toEqual({
			action: InputAction.Import,
			data: {
				action: InputAction.Import,
				params: {
					data: 'secret-value',
					backupPreference: EBackupPreference.encryptedFile,
				},
			},
			source: 'deeplink',
			rawInput,
		});
	});

	it('normalizes valid recovery phrases for import', async () => {
		mnemonicPhraseToKeypairMock.mockResolvedValue(
			ok({ secret_key: 'secret-key', public_key: 'public-key', uri: 'pubky://public-key' }),
		);

		const parsed = await parseInput('one-two_three+four five six seven eight nine ten eleven twelve', 'clipboard');

		expect(parsed).toEqual({
			action: InputAction.Import,
			data: {
				action: InputAction.Import,
				params: {
					data: 'one two three four five six seven eight nine ten eleven twelve',
					backupPreference: EBackupPreference.recoveryPhrase,
				},
			},
			source: 'clipboard',
			rawInput: 'one-two_three+four five six seven eight nine ten eleven twelve',
		});
	});
});
