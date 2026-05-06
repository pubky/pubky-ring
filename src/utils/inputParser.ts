/**
 * Unified Input Parser
 *
 * This module provides a single entry point for parsing all input types:
 * - Deeplinks (pubkyring://, pubkyauth://)
 * - QR codes (scanned data)
 * - Clipboard content (pasted data)
 *
 * All input sources converge here to produce a standardized ParsedInput object
 * that can be routed to the appropriate action handler.
 */

import { parseAuthUrl } from '@synonymdev/react-native-pubky';
import { mnemonicPhraseToKeypair, getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';
import { EBackupPreference } from '../types/pubky';

// Input source types
export type InputSource = 'deeplink' | 'scan' | 'clipboard';

// Action types that can be performed
export enum InputAction {
	Auth = 'auth',
	Import = 'import',
	Migrate = 'migrate',
	Signup = 'signup',
	Invite = 'invite',
	Session = 'session',
	HomeserverSignIn = 'homeserver_signin',
	Unknown = 'unknown',
}

// Signup parameters extracted from signup deeplinks
export interface SignupParams {
	homeserver: string;
	inviteCode: string;
	relay: string;
	secret: string;
	caps: string[];
	xCallback?: XCallbackParams;
}

// x-callback-url parameters for inter-app communication
export interface XCallbackParams {
	xSource?: string;
	xSuccess?: string;
	xError?: string;
	xCancel?: string;
}

// Auth parameters extracted from auth URLs
export interface AuthParams {
	relay: string;
	secret: string;
	caps: string[];
	xCallback?: XCallbackParams;
}

// Import parameters for recovery phrases and secret keys
export interface ImportParams {
	data: string;
	backupPreference: EBackupPreference;
}

// Invite parameters
export interface InviteParams {
	inviteCode: string;
	xCallback?: XCallbackParams;
}

// Session parameters for external app session requests
export interface SessionParams {
	xCallback?: XCallbackParams;
}

// Migrate parameters for multi-key migration QR codes
export interface MigrateParams {
	index: number;
	total: number;
	key: string;
}

// Union type for all action data
export type ActionData =
	| { action: InputAction.Auth; params: AuthParams; rawUrl: string }
	| { action: InputAction.Import; params: ImportParams }
	| { action: InputAction.Migrate; params: MigrateParams }
	| { action: InputAction.Signup; params: SignupParams }
	| { action: InputAction.Invite; params: InviteParams }
	| { action: InputAction.Session; params: SessionParams }
	| { action: InputAction.HomeserverSignIn; params: { url: string } }
	| { action: InputAction.Unknown; params: { rawData: string } };

// The standardized parsed input type
export interface ParsedInput {
	action: InputAction;
	data: ActionData;
	source: InputSource;
	rawInput: string;
}

/**
 * Formats raw import data by normalizing it for validation
 */
export const formatImportData = (data: string): string => {
	if (!data) return '';

	let formatted = data.trim();

	// Decode URL encoding if present
	if (formatted.includes('://') || formatted.includes('%20')) {
		try {
			formatted = decodeURIComponent(formatted);
		} catch {
			// Continue with original if decoding fails
		}
	}

	// Remove custom protocol prefixes
	formatted = formatted.replace(/^pubkyring:\/\//, '');
	formatted = formatted.replace(/^pubkyauth:\/\//, '');

	// Normalize word separators to spaces (for recovery phrases)
	formatted = formatted.replace(/[-_+]+/g, ' ');

	return formatted;
};

/**
 * Validates and determines the backup preference for import data
 */
const validateImportData = async (
	data: string
): Promise<{ isValid: boolean; backupPreference: EBackupPreference }> => {
	const formatted = formatImportData(data);

	// Check if it's a valid mnemonic phrase
	const mnemonicRes = await mnemonicPhraseToKeypair(formatted);
	if (mnemonicRes.isOk()) {
		return { isValid: true, backupPreference: EBackupPreference.recoveryPhrase };
	}

	// Check if it's a valid encrypted secret key
	const secretKeyRes = await getPublicKeyFromSecretKey(formatted);
	if (secretKeyRes.isOk()) {
		return { isValid: true, backupPreference: EBackupPreference.encryptedFile };
	}

	return { isValid: false, backupPreference: EBackupPreference.unknown };
};

/**
 * Parses invite code from a URL
 * Pattern: /invite/XXXX-XXXX-XXXX
 */
const parseInviteCodeFromUrl = (url: string): string | null => {
	const invitePattern = /\/invite\/([A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4})/;
	const match = url.match(invitePattern);
	return match ? match[1] : null;
};

/**
 * Checks if a string is a valid invite code format
 */
const isValidInviteCode = (code: string): boolean => {
	return /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/i.test(code);
};

/**
 * Extracts x-callback-url parameters from a still-encoded query string.
 *
 * Operates on the raw, encoded query so that callback URLs containing inner
 * '?', '=', or '&' (encoded as %3F, %3D, %26) are captured verbatim and
 * decoded exactly once. Apps like Bitkit verify a nonce in the callback URL
 * they originally supplied, so the URL must round-trip byte-for-byte after a
 * single decode.
 *
 * Supports legacy `callback` parameter as fallback for `x-success`.
 */
export const extractXCallbackParams = (encodedQueryString: string): XCallbackParams | undefined => {
	const getRawValue = (key: string): string | undefined => {
		// Match `key=...` at start, or `?key=...`, or `&key=...`, capturing up to
		// the next `&` or end of string. Keys are fixed identifiers (letters and
		// dashes); safe to interpolate without escape.
		const re = new RegExp(`(?:^|[?&])${key}=([^&]*)`);
		const m = encodedQueryString.match(re);
		return m ? m[1] : undefined;
	};

	const safeDecode = (s: string): string => {
		try { return decodeURIComponent(s); } catch { return s; }
	};

	const xSuccessRaw = getRawValue('x-success');
	const xErrorRaw   = getRawValue('x-error');
	const xCancelRaw  = getRawValue('x-cancel');
	const xSourceRaw  = getRawValue('x-source');
	const callbackRaw = getRawValue('callback');

	const successRaw = xSuccessRaw ?? callbackRaw;

	if (successRaw === undefined && xErrorRaw === undefined && xCancelRaw === undefined && xSourceRaw === undefined) {
		return undefined;
	}

	return {
		xSuccess: successRaw  !== undefined ? safeDecode(successRaw)  : undefined,
		xError:   xErrorRaw   !== undefined ? safeDecode(xErrorRaw)   : undefined,
		xCancel:  xCancelRaw  !== undefined ? safeDecode(xCancelRaw)  : undefined,
		xSource:  xSourceRaw  !== undefined ? safeDecode(xSourceRaw)  : undefined,
	};
};

/**
 * Parses signup deeplink parameters
 * Format: signup?hs={homeserver}&st={signup_token}&relay={relay_url}&secret={secret}&caps={capabilities}
 *
 * `queryString` is the (possibly multi-pass-decoded) query for plain fields;
 * `encodedQueryString` is the original encoded query used for x-callback
 * extraction so inner callback URLs are preserved verbatim.
 */
const parseSignupParams = (queryString: string, encodedQueryString: string): SignupParams | null => {
	try {
		const params = new URLSearchParams(queryString);
		return {
			homeserver: decodeURIComponent(params.get('hs') || ''),
			inviteCode: params.get('st') || '',
			relay: decodeURIComponent(params.get('relay') || ''),
			secret: params.get('secret') || '',
			caps: (params.get('caps') || '').split(',').filter(Boolean),
			xCallback: extractXCallbackParams(encodedQueryString),
		};
	} catch {
		return null;
	}
};

/**
 * Parses session deeplink parameters
 * Format: session?x-success={url}&x-error={url}&x-cancel={url}&x-source={name}
 * Legacy: session?callback={callback_url}
 */
const parseSessionParams = (encodedQueryString: string): SessionParams | null => {
	try {
		const xCallback = extractXCallbackParams(encodedQueryString);
		if (!xCallback?.xSuccess) {
			return null;
		}
		return { xCallback };
	} catch {
		return null;
	}
};

/**
 * Main parsing function - the single entry point for all input parsing
 *
 * @param rawInput - The raw input string from any source
 * @param source - Where the input came from (deeplink, scan, clipboard)
 * @returns ParsedInput object with action type, data, and metadata
 */
export const parseInput = async (
	rawInput: string,
	source: InputSource
): Promise<ParsedInput> => {
	if (!rawInput || typeof rawInput !== 'string') {
		return {
			action: InputAction.Unknown,
			data: { action: InputAction.Unknown, params: { rawData: rawInput || '' } },
			source,
			rawInput: rawInput || '',
		};
	}

	let processedInput = rawInput.trim();

	// Snapshot of the original (still-encoded) query string. Used only for
	// x-callback URL extraction so values like `x-cancel=bitkit%3A%2F%2F...`
	// containing inner '?', '=', or '&' are preserved verbatim and decoded
	// exactly once.
	const rawQueryStart = processedInput.indexOf('?');
	const rawEncodedQuery = rawQueryStart !== -1 ? processedInput.substring(rawQueryStart) : '';

	// Try to decode URL encoding - may need multiple passes for double-encoded URLs
	let decoded = processedInput;
	for (let i = 0; i < 3; i++) {
		try {
			const newDecoded = decodeURIComponent(decoded);
			if (newDecoded === decoded) break; // No more encoding to decode
			decoded = newDecoded;
		} catch {
			break; // Stop if decoding fails
		}
	}
	processedInput = decoded;

	// Check for migrate deeplink format (pubkyring://migrate?index=X&total=Y&key=Z)
	// This must be checked early before other parsing strips the protocol
	// Normalize trailing slash before query string for migrate URL
	if (processedInput.startsWith('pubkyring://migrate/?')) processedInput = processedInput.replace('pubkyring://migrate/?', 'pubkyring://migrate?');
	if (processedInput.startsWith('pubkyring://migrate?')) {
		try {
			const queryString = processedInput.substring('pubkyring://migrate?'.length);
			const params = new URLSearchParams(queryString);
			const index = parseInt(params.get('index') || '', 10);
			const total = parseInt(params.get('total') || '', 10);
			const key = decodeURIComponent(params.get('key') || '');

			if (!isNaN(index) && !isNaN(total) && key) {
				return {
					action: InputAction.Migrate,
					data: {
						action: InputAction.Migrate,
						params: {
							index,
							total,
							key,
						},
					},
					source,
					rawInput,
				};
			}
		} catch {
			// Invalid format, continue with other parsing
		}
	}

	// Remove pubkyring:// wrapper protocol if present
	// This handles cases like pubkyring://pubkyauth:///?...
	if (processedInput.startsWith('pubkyring://')) {
		processedInput = processedInput.replace('pubkyring://', '');
	}

	// Fix malformed pubkyauth URL (pubkyauth/// -> pubkyauth:///)
	// Some sources may omit the colon
	if (processedInput.startsWith('pubkyauth///')) {
		processedInput = processedInput.replace('pubkyauth///', 'pubkyauth:///');
	}

	// Remove protocol prefixes for further analysis
	let urlWithoutProtocol = processedInput;
	if (urlWithoutProtocol.startsWith('pubkyauth://')) {
		urlWithoutProtocol = urlWithoutProtocol.replace('pubkyauth://', '');
	}

	// Normalize: remove trailing slash before query string for known routes
	if (urlWithoutProtocol.startsWith('signup/?')) urlWithoutProtocol = urlWithoutProtocol.replace('signup/?', 'signup?');
	if (urlWithoutProtocol.startsWith('session/?')) urlWithoutProtocol = urlWithoutProtocol.replace('session/?', 'session?');
	if (urlWithoutProtocol.startsWith('signin/?')) urlWithoutProtocol = urlWithoutProtocol.replace('signin/?', 'signin?');

	// 1. Check for signup deeplink
	// Format: pubkyring://signup?... or pubkyauth://signup?...
	if (urlWithoutProtocol.startsWith('signup?')) {
		const queryString = urlWithoutProtocol.substring(7); // Remove "signup?"
		const signupParams = parseSignupParams(queryString, rawEncodedQuery);
		if (signupParams?.homeserver && signupParams?.inviteCode) {
			return {
				action: InputAction.Signup,
				data: { action: InputAction.Signup, params: signupParams },
				source,
				rawInput,
			};
		}
	}

	// 2. Check for session deeplink
	// Format: pubkyring://session?x-success={url} or pubkyring://session?callback={url}
	if (urlWithoutProtocol.startsWith('session?')) {
		const sessionParams = parseSessionParams(rawEncodedQuery);
		if (sessionParams?.xCallback?.xSuccess) {
			return {
				action: InputAction.Session,
				data: { action: InputAction.Session, params: sessionParams },
				source,
				rawInput,
			};
		}
	}

	// 3. Check for signin deeplink (alternative auth format)
	// Format: pubkyring://signin?caps=...&secret=...&relay=...
	// Convert to pubkyauth:/// format for parsing
	if (urlWithoutProtocol.startsWith('signin?')) {
		const queryString = urlWithoutProtocol.substring(7); // Remove "signin?"
		processedInput = `pubkyauth:///?${queryString}`;
	}

	// 4. Check for auth URL
	// Format: pubkyauth:///...
	const authResult = await parseAuthUrl(processedInput);
	if (authResult.isOk()) {
		// Extract optional x-callback-url parameters from the original
		// (still-encoded) query so inner callback URLs round-trip verbatim.
		const xCallback = extractXCallbackParams(rawEncodedQuery);

		return {
			action: InputAction.Auth,
			data: {
				action: InputAction.Auth,
				params: {
					relay: authResult.value.relay,
					secret: authResult.value.secret,
					caps: authResult.value.capabilities.map(c => `${c.path}:${c.permission}`),
					xCallback,
				},
				rawUrl: processedInput,
			},
			source,
			rawInput,
		};
	}

	// 5. Check for invite code in URL
	const inviteCode = parseInviteCodeFromUrl(processedInput);
	if (inviteCode) {
		// Extract x-callback params from the original encoded query so inner
		// callback URLs round-trip verbatim.
		const inviteXCallback = extractXCallbackParams(rawEncodedQuery);
		return {
			action: InputAction.Invite,
			data: { action: InputAction.Invite, params: { inviteCode, xCallback: inviteXCallback } },
			source,
			rawInput,
		};
	}

	// 6. Check if it's a standalone invite code (XXXX-XXXX-XXXX format)
	if (isValidInviteCode(urlWithoutProtocol)) {
		return {
			action: InputAction.Invite,
			data: { action: InputAction.Invite, params: { inviteCode: urlWithoutProtocol } },
			source,
			rawInput,
		};
	}

	// 7. Check for import data (recovery phrase or secret key)
	const formatted = formatImportData(processedInput);
	const importValidation = await validateImportData(formatted);
	if (importValidation.isValid) {
		return {
			action: InputAction.Import,
			data: {
				action: InputAction.Import,
				params: {
					data: formatted,
					backupPreference: importValidation.backupPreference,
				},
			},
			source,
			rawInput,
		};
	}

	// 8. Quick check for recovery phrase pattern (12 words) even if validation failed
	// This handles cases where the mnemonic might be valid but validation takes time
	const words = formatted.trim().split(/\s+/);
	if (words.length === 12) {
		// Re-validate more carefully
		const mnemonicRes = await mnemonicPhraseToKeypair(formatted.toLowerCase());
		if (mnemonicRes.isOk()) {
			return {
				action: InputAction.Import,
				data: {
					action: InputAction.Import,
					params: {
						data: formatted.toLowerCase(),
						backupPreference: EBackupPreference.recoveryPhrase,
					},
				},
				source,
				rawInput,
			};
		}
	}

	// 9. Default to unknown
	return {
		action: InputAction.Unknown,
		data: { action: InputAction.Unknown, params: { rawData: processedInput } },
		source,
		rawInput,
	};
};

/**
 * Type guards for action data
 */
export const isAuthAction = (
	data: ActionData
): data is { action: InputAction.Auth; params: AuthParams; rawUrl: string } => {
	return data.action === InputAction.Auth;
};

export const isImportAction = (
	data: ActionData
): data is { action: InputAction.Import; params: ImportParams } => {
	return data.action === InputAction.Import;
};

export const isMigrateAction = (
	data: ActionData
): data is { action: InputAction.Migrate; params: MigrateParams } => {
	return data.action === InputAction.Migrate;
};

export const isSignupAction = (
	data: ActionData
): data is { action: InputAction.Signup; params: SignupParams } => {
	return data.action === InputAction.Signup;
};

export const isInviteAction = (
	data: ActionData
): data is { action: InputAction.Invite; params: InviteParams } => {
	return data.action === InputAction.Invite;
};

export const isSessionAction = (
	data: ActionData
): data is { action: InputAction.Session; params: SessionParams } => {
	return data.action === InputAction.Session;
};

export const isUnknownAction = (
	data: ActionData
): data is { action: InputAction.Unknown; params: { rawData: string } } => {
	return data.action === InputAction.Unknown;
};
