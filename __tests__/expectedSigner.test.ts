import { err, ok } from '@synonymdev/result';
import * as Pubky from '@synonymdev/react-native-pubky';
import type { PubkyDeepLinkDetails } from '@synonymdev/react-native-pubky';
import {
	findStoredPubky,
	isExpectedSigner,
	parseExpectedSigner,
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
const GRANT_URL =
	'pubkyauth://signin_grant?caps=%2Fpub%2Fpubky.app%2F%3Arw&relay=https%3A%2F%2Fhttprelay.pubky.app%2Finbox&secret=auth-secret&cid=pubky.app&cpk=client-pubky';

describe('parseExpectedSigner', () => {
	it('treats a missing spk as no hint', () => {
		expect(parseExpectedSigner(GRANT_URL)).toEqual({ ok: true });
		expect(parseExpectedSigner('pubkyauth://signin_grant')).toEqual({ ok: true });
	});

	it('reads one z32 spk', () => {
		expect(parseExpectedSigner(`${GRANT_URL}&spk=${USER}`)).toEqual({ ok: true, expectedSigner: USER });
	});

	it.each([
		['empty', 'spk='],
		['malformed', 'spk=not-a-pubky'],
		['pubky-prefixed', `spk=pubky${USER}`],
		['pk-prefixed', `spk=pk:${USER}`],
		['repeated', `spk=${USER}&spk=${USER}`],
	])('rejects spk when it is %s', (_case, query) => {
		expect(parseExpectedSigner(`${GRANT_URL}&${query}`)).toEqual({ ok: false });
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
