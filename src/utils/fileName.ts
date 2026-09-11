/**
 * File name helpers.
 *
 * Kept free of React Native imports so they can be unit tested directly.
 */

/**
 * Characters that cannot be part of a file name on at least one platform we support.
 * `/` and `\` are path separators; the rest are rejected by the Android and iOS file APIs.
 */
// eslint-disable-next-line no-control-regex -- control characters are not valid in file names
const INVALID_FILE_NAME_CHARS = /[/\\:*?"<>|\u0000-\u001f]/g;

/**
 * Makes a user-provided string safe to use as a file name.
 *
 * Pubky names are free-form, so a name like `The Biz / usr2ios` would otherwise produce a
 * path with a missing directory in it (`.../the-biz-/-usr2ios-backup.pkarr`) and the write
 * would fail with ENOENT. Characters that cannot appear in a file name are replaced with a
 * dash, leading and trailing dots, dashes and whitespace are dropped (so the result cannot
 * become a hidden file or a relative path), and the fallback is used if nothing is left.
 *
 * @param fileName String to sanitize.
 * @param fallback Name to use when nothing usable is left.
 * @returns {string} A file name that is safe on iOS and Android.
 */
export const sanitizeFileName = (fileName: string, fallback = 'pubky-backup'): string => {
	const sanitized = fileName.replace(INVALID_FILE_NAME_CHARS, '-').replace(/^[\s.-]+|[\s.-]+$/g, '');
	return sanitized || fallback;
};
