import i18n from 'i18next';

// Matches emptyState.placeholderName in every locale. Used if this runs before i18n is initialized.
const FALLBACK_PLACEHOLDER_NAME = 'pubky';

type NamedPubkys = Record<string, unknown>;

/** The label used for pubkys without a name, e.g. "pubky". */
export const getPubkyPlaceholderName = (): string =>
	(i18n.isInitialized && i18n.t('emptyState.placeholderName')) || FALLBACK_PLACEHOLDER_NAME;

/** Formats a default pubky name, e.g. "pubky #3". */
export const formatDefaultPubkyName = (number: number): string => `${getPubkyPlaceholderName()} #${number}`;

const EXTERNAL_NAME_SUFFIX = /\s*\(bitkit\)$/i;

const normalizeName = (name: string): string => name.trim().toLocaleLowerCase();

/** The stored name, or '' when the entry or its name is missing, blank or malformed. */
const storedName = (data: unknown): string => {
	const name = typeof data === 'object' && data !== null ? (data as { name?: unknown }).name : undefined;
	return typeof name === 'string' ? name.trim() : '';
};

const getTakenNames = (pubkys: NamedPubkys, exclude?: string): Set<string> => {
	const taken = new Set<string>();
	for (const [pubky, data] of Object.entries(pubkys)) {
		const name = storedName(data);
		if (pubky === exclude || !name) continue;
		taken.add(normalizeName(name));
		// "pubky #2 (Bitkit)" also uses "pubky #2", so a Ring key never gets the same number.
		taken.add(normalizeName(name.replace(EXTERNAL_NAME_SUFFIX, '')));
	}
	return taken;
};

const isTaken = (taken: Set<string>, number: number): boolean =>
	taken.has(normalizeName(formatDefaultPubkyName(number)));

const firstFreeDefaultName = (taken: Set<string>): string => {
	let number = 1;
	while (isTaken(taken, number)) {
		number += 1;
	}
	return formatDefaultPubkyName(number);
};

/**
 * Returns the lowest free default name ("pubky #N") that no other pubky uses.
 * Names are compared trimmed and case-insensitively, so "Pubky #2" also takes "pubky #2",
 * and an adopted "pubky #2 (Bitkit)" takes it too.
 * @param pubkys All stored pubkys.
 * @param exclude A pubky whose own name should not count as taken, e.g. the one being renamed.
 */
export const nextDefaultPubkyName = (pubkys: NamedPubkys, exclude?: string): string =>
	firstFreeDefaultName(getTakenNames(pubkys, exclude));

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Returns a profile name fetched for `pubky` if it may replace the pubky's allocated default name:
 * a non-blank string (trimmed) that is not a default-style "pubky #N" another pubky already uses.
 * Returns undefined to keep the allocated name.
 */
export const usableProfileName = (pubkys: NamedPubkys, pubky: string, name: unknown): string | undefined => {
	const trimmed = typeof name === 'string' ? name.trim() : '';
	if (!trimmed) return undefined;
	const base = trimmed.replace(EXTERNAL_NAME_SUFFIX, '');
	const defaultStyle = new RegExp(`^${escapeRegExp(getPubkyPlaceholderName())} #\\d+$`, 'i');
	if (defaultStyle.test(base) && getTakenNames(pubkys, pubky).has(normalizeName(base))) return undefined;
	return trimmed;
};

/** The name for a pubky adopted from Bitkit, e.g. "pubky #3 (Bitkit)", numbered like Ring's own. */
export const nextExternalPubkyName = (pubkys: NamedPubkys): string =>
	`${nextDefaultPubkyName(pubkys)} (Bitkit)`;

/**
 * The name to show for a pubky: its stored name, or the placeholder for the rare pubky without one.
 * Never derived from the list position, so it does not change when pubkys are reordered or deleted.
 */
export const getPubkyDisplayName = (pubkyData?: unknown): string =>
	storedName(pubkyData) || getPubkyPlaceholderName();

/**
 * Gives every unnamed pubky a stored name, keeping the order of the map.
 * First, each one keeps the label it was shown with before names were stored ("pubky #<position>")
 * where no other pubky uses it. Then the ones that clashed get the lowest free number.
 * Entries that are not objects are passed through unchanged.
 */
export const assignDefaultPubkyNames = <T>(pubkys: Record<string, T>): Record<string, T> => {
	const taken = getTakenNames(pubkys);
	const result: Record<string, T> = { ...pubkys };
	const clashed: Array<string> = [];
	Object.entries(pubkys).forEach(([pubky, data], index) => {
		if (typeof data !== 'object' || data === null || storedName(data)) return;
		if (isTaken(taken, index + 1)) {
			clashed.push(pubky);
			return;
		}
		const name = formatDefaultPubkyName(index + 1);
		taken.add(normalizeName(name));
		result[pubky] = { ...data, name };
	});
	for (const pubky of clashed) {
		const name = firstFreeDefaultName(taken);
		taken.add(normalizeName(name));
		result[pubky] = { ...result[pubky], name };
	}
	return result;
};
