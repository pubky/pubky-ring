import { err, ok } from '@synonymdev/result';
import * as Pubky from '@synonymdev/react-native-pubky';
import type { PubkyDeepLinkDetails } from '@synonymdev/react-native-pubky';
import {
	findStoredPubky,
	isExpectedSigner,
	parseExpectedSigner,
	parseRequestExpectedSigner,
	toZ32Pubky,
} from '../src/utils/expectedSigner';
import { InputAction, parseInput } from '../src/utils/inputParser';

jest.mock('@synonymdev/react-native-pubky');

const parseDeepLinkMock = Pubky.parseDeepLink as jest.MockedFunction<typeof Pubky.parseDeepLink>;
const mnemonicPhraseToKeypairMock = Pubky.mnemonicPhraseToKeypair as jest.MockedFunction<
	typeof Pubky.mnemonicPhraseToKeypair
>;
const getPublicKeyFromSecretKeyMock = Pubky.getPublicKeyFromSecretKey as jest.MockedFunction<
	typeof Pubky.getPublicKeyFromSecretKey
>;

const USER = '8um71us3fyw6h8wbcxb5ar3rwusy1a6u49956ikzojg3gcwd1dty';
const OTHER = '5jsjx1o6fzu6aeeo697r3i5rx15zq41kikcye8wtwdqm4nb4tryo';
const GRANT_QUERY =
	'caps=%2Fpub%2Fpubky.app%2F%3Arw&relay=https%3A%2F%2Fhttprelay.pubky.app%2Finbox&secret=auth-secret&cid=pubky.app&cpk=client-pubky';
const GRANT_URL = `pubkyauth://signin_grant?${GRANT_QUERY}`;

describe('parseExpectedSigner', () => {
	it('treats a missing spk as no hint', () => {
		expect(parseExpectedSigner(GRANT_QUERY)).toEqual({ ok: true });
		expect(parseExpectedSigner('')).toEqual({ ok: true });
	});

	it('reads one z32 spk', () => {
		expect(parseExpectedSigner(`${GRANT_QUERY}&spk=${USER}`)).toEqual({ ok: true, expectedSigner: USER });
		expect(parseExpectedSigner(`?${GRANT_QUERY}&spk=${OTHER}`)).toEqual({ ok: true, expectedSigner: OTHER });
	});

	it('ignores an spk inside an encoded callback URL', () => {
		const callback = encodeURIComponent(`app://done?nonce=1&spk=${OTHER}`);
		expect(parseExpectedSigner(`${GRANT_QUERY}&x-success=${callback}`)).toEqual({ ok: true });
		expect(parseExpectedSigner(`${GRANT_QUERY}&x-success=${callback}&spk=${USER}`)).toEqual({
			ok: true,
			expectedSigner: USER,
		});
	});

	it.each([
		['empty', 'spk='],
		['malformed', 'spk=not-a-pubky'],
		['pubky-prefixed', `spk=pubky${USER}`],
		['pk-prefixed', `spk=pk:${USER}`],
		['repeated', `spk=${USER}&spk=${USER}`],
		['non-canonical', `spk=${USER.slice(0, -1)}b`],
		['followed by an extra =', `spk=${USER}=junk`],
		['a malformed escape', 'spk=%ZZ'],
		['an encoded = and junk', `spk=${USER}%3Djunk`],
		['repeated under an encoded name', `spk=${USER}&sp%6B=${OTHER}`],
	])('rejects spk when it is %s', (_case, query) => {
		expect(parseExpectedSigner(`${GRANT_QUERY}&${query}`)).toEqual({ ok: false });
	});

	it('decodes the spk value once, as URL parsers do', () => {
		expect(parseExpectedSigner(`${GRANT_QUERY}&spk=${USER.replace('8', '%38')}`)).toEqual({
			ok: true,
			expectedSigner: USER,
		});
	});

	it('reads the query only up to the fragment', () => {
		expect(parseExpectedSigner(`${GRANT_QUERY}&spk=${USER}#context`)).toEqual({
			ok: true,
			expectedSigner: USER,
		});
		expect(parseExpectedSigner(`${GRANT_QUERY}#&spk=${USER}`)).toEqual({ ok: true });
	});

	it('does not decode other values, so a literal or stray percent cannot fail it', () => {
		expect(parseExpectedSigner(`${GRANT_QUERY}&x-source=100% Wallet&spk=${USER}`)).toEqual({
			ok: true,
			expectedSigner: USER,
		});
		expect(parseExpectedSigner(`${GRANT_QUERY}&x-source=100%&%E0%A4%A=1`)).toEqual({ ok: true });
	});
});

describe('parseRequestExpectedSigner', () => {
	it('uses the hint when the request as written and the decoded URL agree', () => {
		const rawInput = `${GRANT_URL}&spk=${USER}`;
		expect(parseRequestExpectedSigner(rawInput, decodeURIComponent(rawInput))).toEqual({
			ok: true,
			expectedSigner: USER,
		});
		expect(parseRequestExpectedSigner(GRANT_URL, decodeURIComponent(GRANT_URL))).toEqual({ ok: true });
	});

	it('reads the hint of a link wrapped whole in percent-encoding', () => {
		const link = `${GRANT_URL}&spk=${USER}`;
		const wrapped = `pubkyring://${encodeURIComponent(link)}`;
		expect(parseRequestExpectedSigner(wrapped, decodeURIComponent(wrapped))).toEqual({
			ok: true,
			expectedSigner: USER,
		});
		const twice = encodeURIComponent(wrapped);
		expect(parseRequestExpectedSigner(twice, decodeURIComponent(decodeURIComponent(twice)))).toEqual({
			ok: true,
			expectedSigner: USER,
		});
	});

	it('reads the hint of a link wrapped three times, the most parseInput decodes', () => {
		const thrice = encodeURIComponent(
			encodeURIComponent(`pubkyring://${encodeURIComponent(`${GRANT_URL}&spk=${USER}`)}`),
		);
		const decodedUrl = decodeURIComponent(decodeURIComponent(decodeURIComponent(thrice)));
		expect(parseRequestExpectedSigner(thrice, decodedUrl)).toEqual({ ok: true, expectedSigner: USER });
	});

	it('takes the request query, not a callback query that appears first', () => {
		// The outer `?` is encoded twice and the callback's `?` once, so one decode shows the callback's first.
		const link = `${GRANT_URL}&x-success=${encodeURIComponent('app://done?nonce=1')}&spk=${USER}`;
		const mixed = link.replace('signin_grant?', 'signin_grant%253F').replace(/&/g, '%2526');
		const decodedUrl = decodeURIComponent(decodeURIComponent(mixed));
		expect(decodedUrl).toContain(`spk=${USER}`);
		expect(parseRequestExpectedSigner(mixed, decodedUrl)).toEqual({ ok: true, expectedSigner: USER });
	});

	it('treats a link that cannot be decoded as having no hint of its own', () => {
		const broken = `pubkyring://${encodeURIComponent(GRANT_URL)}%`;
		expect(parseRequestExpectedSigner(broken, broken)).toEqual({ ok: true });
	});

	it('refuses an spk in a decoded URL whose request never shows a query', () => {
		expect(parseRequestExpectedSigner('pubkyring://opaque', `${GRANT_URL}&spk=${USER}`)).toEqual({
			ok: false,
		});
		expect(parseRequestExpectedSigner('pubkyring://opaque', GRANT_URL)).toEqual({ ok: true });
	});

	it.each([
		['hidden in another value', `secret=s${encodeURIComponent(`&spk=${USER}`)}`],
		['nested in a callback URL', `x-success=${encodeURIComponent(`app://done?nonce=1&spk=${OTHER}`)}`],
		[
			'nested beside an outer hint',
			`x-success=${encodeURIComponent(`app://done?nonce=1&spk=${OTHER}`)}&spk=${USER}`,
		],
	])('refuses a request whose decoded URL names another signer: %s', (_case, extra) => {
		const rawInput = `${GRANT_URL}&${extra}`;
		expect(parseRequestExpectedSigner(rawInput, decodeURIComponent(rawInput))).toEqual({ ok: false });
	});

	it('treats a callback spk the same whether or not the whole link is wrapped', () => {
		const link = `${GRANT_URL}&x-success=${encodeURIComponent(`app://done?nonce=1&spk=${OTHER}`)}`;
		const wrapped = `pubkyring://${encodeURIComponent(link)}`;
		expect(parseRequestExpectedSigner(link, decodeURIComponent(link))).toEqual({ ok: false });
		expect(parseRequestExpectedSigner(wrapped, decodeURIComponent(decodeURIComponent(wrapped)))).toEqual({
			ok: false,
		});
	});
});

describe('stored pubky matching', () => {
	it('normalises the prefixes Ring stores pubkys with', () => {
		expect(toZ32Pubky(USER)).toBe(USER);
		expect(toZ32Pubky(`pk:${USER}`)).toBe(USER);
		expect(toZ32Pubky(`pubky${USER}`)).toBe(USER);
	});

	it('matches only the expected pubky', () => {
		expect(isExpectedSigner(`pk:${USER}`, USER)).toBe(true);
		expect(isExpectedSigner(OTHER, USER)).toBe(false);
		expect(isExpectedSigner(OTHER, undefined)).toBe(true);
	});

	it('finds the stored key for the expected pubky', () => {
		const pubkys = { [OTHER]: {}, [`pk:${USER}`]: {} };
		expect(findStoredPubky(pubkys, USER)).toBe(`pk:${USER}`);
		expect(findStoredPubky({ [OTHER]: {} }, USER)).toBeUndefined();
	});
});

describe('parseInput with spk', () => {
	const grantDetails = (url: string): PubkyDeepLinkDetails => ({
		scheme: 'pubkyauth',
		kind: 'signin_grant',
		url,
		relay: 'https://httprelay.pubky.app/inbox',
		secret: 'auth-secret',
		client_id: 'pubky.app',
		client_public_key: 'client-pubky',
		capabilities: [{ path: '/pub/pubky.app/', permission: 'rw' }],
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mnemonicPhraseToKeypairMock.mockResolvedValue(err('not a mnemonic'));
		getPublicKeyFromSecretKeyMock.mockResolvedValue(err('not a secret key'));
	});

	it('carries the hint of a signin_grant request', async () => {
		const rawInput = `${GRANT_URL}&spk=${USER}`;
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(rawInput)));

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data).toMatchObject({
			action: InputAction.Auth,
			params: { kind: 'signin_grant', expectedSigner: USER },
		});
	});

	it('leaves requests without spk unchanged', async () => {
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(GRANT_URL)));

		const parsed = await parseInput(GRANT_URL, 'deeplink');

		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data.action === InputAction.Auth && 'expectedSigner' in parsed.data.params).toBe(false);
	});

	it('refuses a request that hides spk inside another encoded value', async () => {
		const rawInput = `${GRANT_URL}&x-source=${encodeURIComponent(`App&spk=${USER}`)}`;
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(decodeURIComponent(rawInput))));

		const parsed = await parseInput(rawInput, 'scan');

		expect(parsed.action).toBe(InputAction.Unknown);
	});

	it('keeps a valid grant link with a literal percent in another value', async () => {
		const rawInput = `${GRANT_URL}&x-source=100%25%20Wallet`;
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(decodeURIComponent(rawInput))));

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Auth);
	});

	it('reads the hint of a link that ends in a fragment', async () => {
		const rawInput = `${GRANT_URL}&spk=${USER}#context`;
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(rawInput)));

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.data).toMatchObject({ action: InputAction.Auth, params: { expectedSigner: USER } });
	});

	it('refuses a wrapped link whose only spk is inside its callback URL', async () => {
		const link = `${GRANT_URL}&x-success=${encodeURIComponent(`app://done?nonce=1&spk=${OTHER}`)}`;
		const rawInput = `pubkyring://${encodeURIComponent(link)}`;
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(decodeURIComponent(decodeURIComponent(rawInput)))));

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Unknown);
	});

	it('ignores spk on legacy signin requests', async () => {
		const rawInput = `pubkyauth://signin?caps=%2Fpub%2Fpubky.app%2F%3Arw&relay=https%3A%2F%2Fhttprelay.pubky.app%2Finbox&secret=auth-secret&spk=${USER}`;
		parseDeepLinkMock.mockResolvedValue(ok({ ...grantDetails(rawInput), kind: 'signin' }));

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Auth);
		expect(parsed.data.action === InputAction.Auth && parsed.data.params.expectedSigner).toBeFalsy();
	});

	it('refuses a signin_grant request with a malformed spk', async () => {
		const rawInput = `${GRANT_URL}&spk=${USER}&spk=${OTHER}`;
		parseDeepLinkMock.mockResolvedValue(ok(grantDetails(rawInput)));

		const parsed = await parseInput(rawInput, 'deeplink');

		expect(parsed.action).toBe(InputAction.Unknown);
	});
});
