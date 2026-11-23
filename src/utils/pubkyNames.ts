import i18n from 'i18next';

// Matches emptyState.placeholderName in every locale. Used if this runs before i18n is initialized.
const FALLBACK_PLACEHOLDER_NAME = 'pubky';

type NamedPubkys = Record<string, { name?: string } | undefined>;

/** The label used for pubkys without a name, e.g. "pubky". */
export const getPubkyPlaceholderName = (): string =>
	(i18n.isInitialized && i18n.t('emptyState.placeholderName')) || FALLBACK_PLACEHOLDER_NAME;

/** Formats a default pubky name, e.g. "pubky #3". */
export const formatDefaultPubkyName = (number: number): string => `${getPubkyPlaceholderName()} #${number}`;

const normalizeName = (name: string): string => name.trim().toLocaleLowerCase();

const getTakenNames = (pubkys: NamedPubkys, exclude?: string): Set<string> => {
	const taken = new Set<string>();
	for (const [pubky, data] of Object.entries(pubkys)) {
		if (pubky === exclude || !data?.name?.trim()) continue;
		taken.add(normalizeName(data.name));
	}
	return taken;
};

const firstFreeDefaultName = (taken: Set<string>, from = 1): string => {
	let number = Math.max(1, from);
	while (taken.has(normalizeName(formatDefaultPubkyName(number)))) {
		number += 1;
	}
	return formatDefaultPubkyName(number);
};

/**
 * Returns the lowest free default name ("pubky #N") that no other pubky uses.
 * Names are compared trimmed and case-insensitively, so "Pubky #2" also takes "pubky #2".
 * @param pubkys All stored pubkys.
 * @param exclude A pubky whose own name should not count as taken, e.g. the one being renamed.
 */
export const nextDefaultPubkyName = (pubkys: NamedPubkys, exclude?: string): string =>
	firstFreeDefaultName(getTakenNames(pubkys, exclude));

/**
 * The name to show for a pubky: its stored name, or the placeholder for the rare pubky without one.
 * Never derived from the list position, so it does not change when pubkys are reordered or deleted.
 */
export const getPubkyDisplayName = (pubkyData?: { name?: string }): string =>
	pubkyData?.name?.trim() || getPubkyPlaceholderName();

/**
 * Gives every unnamed pubky a stored name, keeping the order of the map.
 * Each one gets the label it was shown with before names were stored ("pubky #<position>"),
 * or the next free number if another pubky already uses that name.
 */
export const assignDefaultPubkyNames = <T extends { name?: string }>(
	pubkys: Record<string, T>,
): Record<string, T> => {
	const taken = getTakenNames(pubkys);
	const result: Record<string, T> = {};
	Object.entries(pubkys).forEach(([pubky, data], index) => {
		if (!data || data.name?.trim()) {
			result[pubky] = data;
			return;
		}
		const name = firstFreeDefaultName(taken, index + 1);
		taken.add(normalizeName(name));
		result[pubky] = { ...data, name };
	});
	return result;
};
