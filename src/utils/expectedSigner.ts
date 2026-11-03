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
const Z32_PUBLIC_KEY = /^[ybndrfg8ejkmcpqxot1uwisza345h769]{52}$/;

export type ExpectedSignerResult =
	| { ok: true; expectedSigner?: string }
	| { ok: false };

/**
 * Reads `spk` from a pubkyauth URL. Absent is fine; an empty, malformed or
 * repeated value makes the request invalid, as in the Pubky SDK parser.
 */
export const parseExpectedSigner = (url: string): ExpectedSignerResult => {
	const queryStart = url.indexOf('?');
	if (queryStart === -1) return { ok: true };

	const values = new URLSearchParams(url.substring(queryStart + 1)).getAll(SPK_PARAM);
	if (values.length === 0) return { ok: true };
	if (values.length > 1 || !Z32_PUBLIC_KEY.test(values[0])) return { ok: false };
	return { ok: true, expectedSigner: values[0] };
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
