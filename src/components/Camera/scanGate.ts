/**
 * How long the same code is ignored after its handler finishes. The camera
 * reports a held-up code many times per second, so this keeps one QR from
 * triggering a burst of handlers while still letting a rescan through.
 */
export const SCAN_COOLDOWN_MS = 2000;

export type ScanHandler = (data: string) => Promise<void> | void;

/**
 * Creates a gate for camera reads:
 * - reads are ignored while the previous handler is still running
 * - the same value is ignored until the cooldown has passed since its handler finished
 * - a different value is handled right away
 *
 * Returns whether the read was passed to the handler.
 */
export const createScanGate = (
	cooldownMs: number = SCAN_COOLDOWN_MS,
): ((data: string, handler: ScanHandler) => boolean) => {
	let inFlight = false;
	let lastValue: string | null = null;
	let lastFinishedAt = 0;

	const finish = (): void => {
		inFlight = false;
		lastFinishedAt = Date.now();
	};

	return (data, handler) => {
		if (inFlight) {
			return false;
		}
		if (data === lastValue && Date.now() - lastFinishedAt < cooldownMs) {
			return false;
		}

		inFlight = true;
		lastValue = data;

		try {
			Promise.resolve(handler(data)).then(finish, error => {
				finish();
				console.error('QR scan handler failed:', error);
			});
		} catch (error) {
			finish();
			console.error('QR scan handler failed:', error);
		}

		return true;
	};
};
