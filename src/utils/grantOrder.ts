import type { GrantInfo } from '../types/pubky.ts';

const compareStrings = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Display order for the authorized apps list. The homeserver returns grants in
 * no defined order, so grants are grouped by client id (alphabetical), newest
 * first within each client, with the grant id as the final tie-break so the
 * order is the same on every refresh. Returns a new array.
 */
export const sortGrantsForDisplay = (grants: GrantInfo[]): GrantInfo[] =>
	[...grants].sort(
		(a, b) =>
			compareStrings(a.client_id, b.client_id) ||
			b.issued_at - a.issued_at ||
			compareStrings(a.grant_id, b.grant_id),
	);
