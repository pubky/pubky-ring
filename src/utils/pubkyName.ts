import i18n from '../i18n';

interface FallbackPubkyNameParams {
	/** Zero-based position in the list the pubky is rendered in. */
	index?: number;
	isBorrowed?: boolean;
}

/**
 * Display name used when a pubky has no profile name of its own.
 *
 * Purely presentational: the fallback is never written back to the store, so a borrowed
 * (Bitkit) identity keeps an empty name while still reading as "pubky #2 (Bitkit)" on screen.
 * Single source of truth so the home card, the selector and the detail screen cannot drift.
 */
export const getFallbackPubkyName = ({ index, isBorrowed = false }: FallbackPubkyNameParams): string => {
	if (isBorrowed) {
		return i18n.t('reuseSharedPubky.fallbackName', { number: (index ?? 0) + 1 });
	}
	const placeholder = i18n.t('emptyState.placeholderName');
	return index === undefined ? placeholder : `${placeholder} #${index + 1}`;
};
