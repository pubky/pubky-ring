import { InputAction, parseInput } from '../src/utils/inputParser';
import { EBackupPreference } from '../src/types/pubky';
import { ok, err } from '@synonymdev/result';
import * as Pubky from '@synonymdev/react-native-pubky';

jest.mock('@synonymdev/react-native-pubky', () => {
	const { err: resultErr } = require('@synonymdev/result');

	return {
		__esModule: true,
		parseAuthUrl: jest.fn(async () => resultErr('not an auth url')),
		mnemonicPhraseToKeypair: jest.fn(async () => resultErr('not a mnemonic')),
		getPublicKeyFromSecretKey: jest.fn(async () => resultErr('not a secret key')),
	};
});

const parseAuthUrlMock = Pubky.parseAuthUrl as jest.MockedFunction<typeof Pubky.parseAuthUrl>;
const mnemonicPhraseToKeypairMock = Pubky.mnemonicPhraseToKeypair as jest.MockedFunction<
	typeof Pubky.mnemonicPhraseToKeypair
>;
const getPublicKeyFromSecretKeyMock = Pubky.getPublicKeyFromSecretKey as jest.MockedFunction<
	typeof Pubky.getPublicKeyFromSecretKey
>;

describe('parseInput', () => {
	beforeEach(() => {
		parseAuthUrlMock.mockResolvedValue(err('not an auth url'));
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
			`hs=${encodeURIComponent('https://homeserver.example.com')}` +
			'&st=ABCD-1234-WXYZ' +
			`&relay=${encodeURIComponent('wss://relay.example.com')}` +
			'&secret=secret-value' +
			'&caps=pubky.app:read,pubky.app:write' +
			`&x-success=${encodeURIComponent(xSuccess)}` +
			'&x-source=Bitkit';

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Signup);
		expect(parsed.data).toEqual({
			action: InputAction.Signup,
			params: {
				homeserver: 'https://homeserver.example.com',
				inviteCode: 'ABCD-1234-WXYZ',
				relay: 'wss://relay.example.com',
				secret: 'secret-value',
				caps: ['pubky.app:read', 'pubky.app:write'],
				xCallback: {
					xSuccess,
					xError: undefined,
					xCancel: undefined,
					xSource: 'Bitkit',
				},
			},
		});
	});

	it('parses signin deeplinks through the Pubky auth parser', async () => {
		parseAuthUrlMock.mockResolvedValue(
			ok({
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				capabilities: [
					{ path: '/pub/pubky.app/profile.json', permission: 'read' },
					{ path: '/pub/pubky.app/session.json', permission: 'write' },
				],
			}),
		);
		const xCancel = 'bitkit://auth/cancel?nonce=abc&reason=user';
		const rawInput =
			'pubkyring://signin?' +
			'caps=ignored-by-mock' +
			'&secret=auth-secret' +
			`&relay=${encodeURIComponent('wss://relay.example.com')}` +
			`&x-cancel=${encodeURIComponent(xCancel)}`;

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parseAuthUrlMock).toHaveBeenCalledWith(expect.stringContaining('pubkyauth:///?'));
		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data).toEqual({
			action: InputAction.Auth,
			params: {
				relay: 'wss://relay.example.com',
				secret: 'auth-secret',
				caps: ['/pub/pubky.app/profile.json:read', '/pub/pubky.app/session.json:write'],
				xCallback: {
					xSuccess: undefined,
					xError: undefined,
					xCancel,
					xSource: undefined,
				},
			},
			rawUrl: expect.stringContaining('pubkyauth:///?'),
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
