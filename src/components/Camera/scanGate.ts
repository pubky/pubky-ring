/**
 * Minimum time between barcode callbacks from the native camera
 * (CameraKit's `scanThrottleDelay`). CameraKit defaults to 2000ms when this
 * isn't set, so it must be passed explicitly.
 */
export const SCAN_THROTTLE_MS = 250;

/**
 * How long a code must be out of view before the same code is handled again.
 * Every ignored read of the same code restarts this window, so a code held in
 * view is handled once. This only works while the cooldown is well above
 * SCAN_THROTTLE_MS: a held code then arrives several times per window and
 * keeps it open. (With the native 2000ms default, a held code would re-fire on
 * every callback.) One second also rides out brief read dropouts (focus,
 * glare, hand shake) while keeping a deliberate rescan (point away, point
 * back) quick.
 */
export const SCAN_COOLDOWN_MS = 1000;

/**
 * A scan that is still running after this long logs a warning. The gate stays
 * closed until the handler settles: reopening it while a slow import is still
 * running would let a rescan start a second one. The gate belongs to one
 * scanner mount, so closing and reopening the scanner resets it.
 */
export const SCAN_SLOW_WARNING_MS = 20000;

export type ScanHandler = (data: string) => Promise<void> | void;

export type ScanOptions = {
	/** Handle the value even if it was just seen, e.g. for a deliberate gallery pick. */
	skipCooldown?: boolean;
};

export type ScanGate = (data: string, handler: ScanHandler, options?: ScanOptions) => boolean;

export type ScanGateConfig = {
	cooldownMs?: number;
	slowWarningMs?: number;
	/** Called when a scan starts (true) and when its handler settles (false). */
	onBusyChange?: (busy: boolean) => void;
};

/**
 * Creates a gate for scanned codes:
 * - every read is ignored until the previous handler has settled
 * - the same value is ignored until it has not been seen for `cooldownMs`
 * - a different value is handled right away
 *
 * Returns whether the value was passed to the handler.
 */
export const createScanGate = ({
	cooldownMs = SCAN_COOLDOWN_MS,
	slowWarningMs = SCAN_SLOW_WARNING_MS,
	onBusyChange,
}: ScanGateConfig = {}): ScanGate => {
	let activeScanId: number | null = null;
	let nextScanId = 0;
	let slowWarning: ReturnType<typeof setTimeout> | null = null;
	let lastValue: string | null = null;
	let lastSeenAt = 0;

	const finish = (scanId: number, data: string): void => {
		if (activeScanId !== scanId) {
			return;
		}
		activeScanId = null;
		// The finished value counts as just seen, so a code still held in view
		// isn't handled again until it has been out of view.
		lastValue = data;
		lastSeenAt = Date.now();
		if (slowWarning) {
			clearTimeout(slowWarning);
			slowWarning = null;
		}
		onBusyChange?.(false);
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
		onBusyChange?.(true);
		slowWarning = setTimeout(() => {
			if (activeScanId === scanId) {
				console.warn(
					`QR scan handler still running after ${slowWarningMs}ms; scanner stays busy until it settles.`,
				);
			}
		}, slowWarningMs);

		const onError = (error: unknown): void => {
			finish(scanId, data);
			console.error('QR scan handler failed:', error);
		};

		try {
			Promise.resolve(handler(data)).then(() => finish(scanId, data), onError);
		} catch (error) {
			onError(error);
		}

		return true;
	};
};
