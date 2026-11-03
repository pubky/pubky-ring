/**
 * Expected signer (`spk`) on grant sign-in requests.
 *
 * An app that already knows the signed-in user can name that user's pubky in a
 * `signin_grant` link, so Ring opens that pubky instead of asking which one to
 * use. The hint only selects a pubky: Ring still signs with a key it holds, the
 * approval screen still shows what is approved, and the requesting app still
 * verifies who approved.
 */

const SPK_PARAM = 'spk';
// 52 z-base-32 symbols encode 260 bits; a 32-byte key leaves the last symbol one
// significant bit, so canonical keys end in `y` or `o`.
const Z32_PUBLIC_KEY = /^[ybndrfg8ejkmcpqxot1uwisza345h769]{51}[yo]$/;

export type ExpectedSignerResult =
	| { ok: true; expectedSigner?: string }
	| { ok: false };

/**
 * Reads `spk` from a pubkyauth query string, still percent-encoded as the app
 * sent it, so an `spk` inside an encoded callback URL is not mistaken for it.
 * Absent is fine; an empty, malformed or repeated value makes the request
 * invalid, as in the Pubky SDK parser.
 */
export const parseExpectedSigner = (encodedQuery: string): ExpectedSignerResult => {
	const values = new URLSearchParams(encodedQuery).getAll(SPK_PARAM);
	if (values.length === 0) return { ok: true };
	if (values.length > 1 || !Z32_PUBLIC_KEY.test(values[0])) return { ok: false };
	return { ok: true, expectedSigner: values[0] };
};

const queryOf = (url: string): string => {
	const queryStart = url.indexOf('?');
	return queryStart === -1 ? '' : url.substring(queryStart + 1);
};

/** The hint in the URL Ring parses and signs (fully decoded by `parseInput`). */
export const expectedSignerOfUrl = (url: string): ExpectedSignerResult => parseExpectedSigner(queryOf(url));

/**
 * The hint of an incoming request. Ring parses and signs the decoded URL, so the
 * hint read from the encoded query must match the one in the decoded URL;
 * otherwise (`%26spk%3D` hidden in another value, an `spk` nested in a
 * callback URL) the request is invalid.
 */
export const parseRequestExpectedSigner = (encodedQuery: string, decodedUrl: string): ExpectedSignerResult => {
	const decoded = expectedSignerOfUrl(decodedUrl);
	if (!encodedQuery) return decoded;
	const encoded = parseExpectedSigner(encodedQuery);
	if (!encoded.ok || !decoded.ok || encoded.expectedSigner !== decoded.expectedSigner) return { ok: false };
	return encoded;
};

/** Ring stores pubkys as raw z32 or with a `pk:` / `pubky` prefix. */
export const toZ32Pubky = (pubky: string): string => {
	if (pubky.startsWith('pk:')) return pubky.slice(3);
	if (pubky.length === 57 && pubky.startsWith('pubky')) return pubky.slice(5);
	return pubky;
};

export const isExpectedSigner = (pubky: string, expectedSigner?: string): boolean =>
	!expectedSigner || toZ32Pubky(pubky) === expectedSigner;

/** Returns the stored key (as Ring keys it) for the expected signer, if Ring has it. */
export const findStoredPubky = (
	pubkys: Record<string, unknown>,
	expectedSigner: string,
): string | undefined => Object.keys(pubkys).find(key => toZ32Pubky(key) === expectedSigner);
