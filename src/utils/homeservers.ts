import type { Pubky } from '../types/pubky';
import { PRODUCTION_HOMESERVER, STAGING_HOMESERVER } from './constants';

/** Accept a bare public key or its public-key URI, never a URL path or query. */
export const normalizeHomeserver = (input: unknown): string | undefined => {
	if (typeof input !== 'string') return undefined;
	const key = input
		.trim()
		.replace(/^(pubky:\/\/|pk:)/i, '')
		.replace(/\/$/, '')
		.toLowerCase();
	return /^[ybndrfg8ejkmcpqxot1uwisza345h769]{51}[yo]$/.test(key) ? key : undefined;
};

export const isSynonymHomeserver = (homeserver: string): boolean => {
	const key = normalizeHomeserver(homeserver);
	return key === PRODUCTION_HOMESERVER || key === STAGING_HOMESERVER;
};

export const homeserverUseCount = (pubkys: Record<string, Pubky>, publicKey: string): number =>
	Object.values(pubkys).filter(
		pubky => (normalizeHomeserver(pubky.homeserver) ?? pubky.homeserver) === publicKey,
	).length;
