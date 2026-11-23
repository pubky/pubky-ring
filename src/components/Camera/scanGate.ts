/**
 * How long a code must be out of view before the same code is handled again.
 * The camera reports a visible code many times per second, and every ignored
 * read restarts this window, so a code held in view is handled once. One
 * second rides out brief read dropouts (focus, glare, hand shake) while still
 * letting a deliberate rescan (point away, point back) through.
 */
export const SCAN_COOLDOWN_MS = 1000;

/**
 * Longest time a scan may hold the gate. If a handler never settles, the gate
 * reopens after this so the scanner doesn't stay locked.
 */
export const SCAN_TIMEOUT_MS = 20000;

export type ScanHandler = (data: string) => Promise<void> | void;

export type ScanGateOptions = {
	/** Handle the value even if it was just seen, e.g. for a deliberate gallery pick. */
	skipCooldown?: boolean;
};

export type ScanGate = (data: string, handler: ScanHandler, options?: ScanGateOptions) => boolean;

/**
 * Creates a gate for scanned codes:
 * - every read is ignored while the previous handler is still running (up to `timeoutMs`)
 * - the same value is ignored until it has not been seen for `cooldownMs`
 * - a different value is handled right away
 *
 * Returns whether the value was passed to the handler.
 */
export const createScanGate = (
	cooldownMs: number = SCAN_COOLDOWN_MS,
	timeoutMs: number = SCAN_TIMEOUT_MS,
): ScanGate => {
	let activeScanId: number | null = null;
	let nextScanId = 0;
	let watchdog: ReturnType<typeof setTimeout> | null = null;
	let lastValue: string | null = null;
	let lastSeenAt = 0;

	const finish = (scanId: number): void => {
		// A scan that already timed out must not reopen the gate during a newer one.
		if (activeScanId !== scanId) {
			return;
		}
		activeScanId = null;
		lastSeenAt = Date.now();
		if (watchdog) {
			clearTimeout(watchdog);
			watchdog = null;
		}
	};

	return (data, handler, options) => {
		if (activeScanId !== null) {
			return false;
		}

		const now = Date.now();
		if (!options?.skipCooldown && data === lastValue && now - lastSeenAt < cooldownMs) {
			lastSeenAt = now;
			return false;
		}

		const scanId = nextScanId++;
		activeScanId = scanId;
		lastValue = data;
		lastSeenAt = now;
		watchdog = setTimeout(() => {
			if (activeScanId === scanId) {
				console.warn(`QR scan handler did not finish within ${timeoutMs}ms; accepting new scans.`);
			}
			finish(scanId);
		}, timeoutMs);

		const onError = (error: unknown): void => {
			finish(scanId);
			console.error('QR scan handler failed:', error);
		};

		try {
			Promise.resolve(handler(data)).then(() => finish(scanId), onError);
		} catch (error) {
			onError(error);
		}

		return true;
	};
};
