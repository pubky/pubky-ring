/**
 * Expected identity (`spk`) on grant sign-in requests.
 *
 * An app that already knows the signed-in user can require that user's pubky in
 * a `signin_grant` link. It is a constraint, not a suggestion: Ring opens that
 * pubky or refuses the request, never offers another one, and the requesting
 * app rejects an approval from any other key. Switching accounts takes a fresh
 * request.
 */

const SPK_PARAM = 'spk';
// 52 z-base-32 symbols encode 260 bits; a 32-byte key leaves the last symbol one
// significant bit, so canonical keys end in `y` or `o`.
const Z32_PUBLIC_KEY = /^[ybndrfg8ejkmcpqxot1uwisza345h769]{51}[yo]$/;

export type ExpectedSignerResult = { ok: true; expectedSigner?: string } | { ok: false };

// Same decode depth as `parseInput`.
const MAX_DECODE_PASSES = 3;

const decodeQueryComponent = (component: string): string | undefined => {
	try {
		return decodeURIComponent(component.replace(/\+/g, ' '));
	} catch {
		return undefined;
	}
};

/**
 * The values of `name` in a query string, which may start with `?`. The query
 * ends at the first `#`, and each pair splits at its first `=`. Names are
 * compared decoded, and only the values of `name` are decoded, once, as URL
 * parsers read them; nothing else in the query is decoded or can make reading
 * it fail. A value that cannot be decoded is returned as undefined.
 */
const queryValues = (query: string, name: string): Array<string | undefined> => {
	const fragmentStart = query.indexOf('#');
	const body = (fragmentStart === -1 ? query : query.substring(0, fragmentStart)).replace(/^\?/, '');
	if (!body) return [];
	return body.split('&').flatMap(pair => {
		const separator = pair.indexOf('=');
		const pairName = separator === -1 ? pair : pair.substring(0, separator);
		if ((decodeQueryComponent(pairName) ?? pairName) !== name) return [];
		return [separator === -1 ? '' : decodeQueryComponent(pair.substring(separator + 1))];
	});
};

/**
 * Reads `spk` from a pubkyauth query string, still percent-encoded as the app
 * sent it, so an `spk` inside an encoded callback URL is not mistaken for it.
 * Absent is fine; an empty, malformed or repeated value makes the request
 * invalid, as in the Pubky SDK parser.
 */
export const parseExpectedSigner = (encodedQuery: string): ExpectedSignerResult => {
	const values = queryValues(encodedQuery, SPK_PARAM);
	if (values.length === 0) return { ok: true };
	const [value] = values;
	if (values.length > 1 || value === undefined || !Z32_PUBLIC_KEY.test(value)) return { ok: false };
	return { ok: true, expectedSigner: value };
};

const queryOf = (url: string): string => {
	const queryStart = url.indexOf('?');
	return queryStart === -1 ? '' : url.substring(queryStart + 1);
};

/** The expected pubky in the URL Ring parses and signs (fully decoded by `parseInput`). */
export const expectedSignerOfUrl = (url: string): ExpectedSignerResult => parseExpectedSigner(queryOf(url));

// The `?` that opens a grant sign-in request's own query.
const SIGNIN_GRANT_QUERY_START = /signin_grant\/?\?/i;

/**
 * The query of the request as its app wrote it. A link wrapped whole in
 * percent-encoding (for example `pubkyring://` plus an encoded `pubkyauth://`
 * link) shows its query only after decoding, so the input is decoded one pass
 * at a time until the request's own query appears, and no further. A `?` that
 * appears earlier inside a value, such as a callback URL, is not the request's.
 * Undefined if the request's query never appears.
 */
const requestQueryOf = (rawInput: string): string | undefined => {
	let input = rawInput;
	for (let pass = 0; pass <= MAX_DECODE_PASSES; pass++) {
		const queryStart = SIGNIN_GRANT_QUERY_START.exec(input);
		if (queryStart) return input.substring(queryStart.index + queryStart[0].length);
		if (pass === MAX_DECODE_PASSES) break;
		let decoded: string;
		try {
			decoded = decodeURIComponent(input);
		} catch {
			break;
		}
		if (decoded === input) break;
		input = decoded;
	}
	return undefined;
};

/**
 * The expected pubky of an incoming request. Ring parses and signs the decoded URL,
 * so the `spk` in the request as its app wrote it must match the one in the decoded URL;
 * otherwise (`%26spk%3D` hidden in another value, an `spk` nested in a
 * callback URL) the request is invalid. A request whose query never appears has
 * no `spk` of its own, so an `spk` in its decoded URL makes it invalid too.
 */
export const parseRequestExpectedSigner = (rawInput: string, decodedUrl: string): ExpectedSignerResult => {
	const decoded = expectedSignerOfUrl(decodedUrl);
	const requestQuery = requestQueryOf(rawInput);
	const written: ExpectedSignerResult =
		requestQuery === undefined ? { ok: true } : parseExpectedSigner(requestQuery);
	if (!written.ok || !decoded.ok || written.expectedSigner !== decoded.expectedSigner) return { ok: false };
	return written;
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
