/**
 * Initial URL consumption guard.
 *
 * `Linking.getInitialURL()` reports the intent that launched the activity, and on Android that
 * intent outlives a single mount: it stays on the activity for the whole process. Claiming it here
 * keeps a remount of the root component from routing the same launch a second time.
 *
 * The guard is per process on purpose. A replayed launch intent and a genuinely new launch carry
 * the same URL - a user who fails a signup, kills the app and re-opens the same onboarding link is
 * indistinguishable from Android resuming a stale task - so nothing is remembered across launches.
 * Detecting a replay needs the intent flags only the platform sees, which is what MainActivity does.
 */

let claimedUrl: string | undefined;

/**
 * Claims an initial URL for handling. Returns false when this exact URL was already claimed earlier
 * in this process, which means it is the same launch intent being read again rather than a new one.
 */
export function claimInitialUrl(url: string): boolean {
	if (claimedUrl === url) return false;
	claimedUrl = url;
	return true;
}

/** Test seam: forgets the claimed URL, standing in for a fresh process. */
export function resetClaimedInitialUrl(): void {
	claimedUrl = undefined;
}
