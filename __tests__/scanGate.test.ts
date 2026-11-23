import {
	createScanGate,
	SCAN_COOLDOWN_MS,
	SCAN_THROTTLE_MS,
	SCAN_TIMEOUT_MS,
} from '../src/components/Camera/scanGate';

const flushPromises = async (): Promise<void> => {
	await Promise.resolve();
	await Promise.resolve();
};

const deferredHandler = (): { handler: jest.Mock<Promise<void>, [string]>; resolve: () => void } => {
	let resolve: () => void = () => {};
	const handler = jest.fn(
		(_data: string) =>
			new Promise<void>(res => {
				resolve = res;
			}),
	);
	return { handler, resolve: () => resolve() };
};

describe('createScanGate', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('ignores the same value within the cooldown', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		expect(gate('pubkyauth://a', handler)).toBe(true);
		await flushPromises();

		jest.advanceTimersByTime(SCAN_COOLDOWN_MS - 1);
		expect(gate('pubkyauth://a', handler)).toBe(false);
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('keeps the cooldown well above the native scan throttle', () => {
		expect(SCAN_COOLDOWN_MS).toBeGreaterThanOrEqual(SCAN_THROTTLE_MS * 3);
	});

	it('handles a code held in view only once at the camera throttle interval', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		for (let elapsed = 0; elapsed <= 10000; elapsed += SCAN_THROTTLE_MS) {
			gate('pubkyauth://a', handler);
			await flushPromises();
			jest.advanceTimersByTime(SCAN_THROTTLE_MS);
		}

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('handles the same code again after it has been out of view for the cooldown', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		for (let elapsed = 0; elapsed <= 3000; elapsed += SCAN_THROTTLE_MS) {
			gate('pubkyauth://a', handler);
			await flushPromises();
			jest.advanceTimersByTime(SCAN_THROTTLE_MS);
		}
		expect(handler).toHaveBeenCalledTimes(1);

		// Out of view: no reads for just over the cooldown.
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS);
		expect(gate('pubkyauth://a', handler)).toBe(true);
		await flushPromises();

		// Back in view: the next read one throttle interval later is ignored again.
		jest.advanceTimersByTime(SCAN_THROTTLE_MS);
		expect(gate('pubkyauth://a', handler)).toBe(false);
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('would re-fire a held code at the old 2000ms native throttle', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		for (let elapsed = 0; elapsed < 10000; elapsed += 2000) {
			gate('pubkyauth://a', handler);
			await flushPromises();
			jest.advanceTimersByTime(2000);
		}

		expect(handler).toHaveBeenCalledTimes(5);
	});

	it('ignores every read while a scan is in flight', async () => {
		const gate = createScanGate();
		const { handler, resolve } = deferredHandler();

		gate('pubkyauth://a', handler);
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS * 2);
		expect(gate('pubkyauth://a', handler)).toBe(false);
		expect(gate('pubkyauth://b', handler)).toBe(false);
		expect(gate('pubkyauth://b', handler, { skipCooldown: true })).toBe(false);
		expect(handler).toHaveBeenCalledTimes(1);

		resolve();
		await flushPromises();
		expect(gate('pubkyauth://b', handler)).toBe(true);
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('starts the cooldown when the scan finishes', async () => {
		const gate = createScanGate();
		const { handler, resolve } = deferredHandler();

		gate('pubkyauth://a', handler);
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS * 2);
		resolve();
		await flushPromises();

		expect(gate('pubkyauth://a', handler)).toBe(false);
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS);
		expect(gate('pubkyauth://a', handler)).toBe(true);
	});

	it('handles a different value immediately', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		gate('pubkyauth://a', handler);
		await flushPromises();

		expect(gate('pubkyauth://b', handler)).toBe(true);
		await flushPromises();
		expect(gate('pubkyauth://a', handler)).toBe(true);
		expect(handler.mock.calls).toEqual([['pubkyauth://a'], ['pubkyauth://b'], ['pubkyauth://a']]);
	});

	it('lets a deliberate pick skip the cooldown and records it for camera reads', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		gate('pubkyauth://a', handler);
		await flushPromises();
		expect(gate('pubkyauth://a', handler, { skipCooldown: true })).toBe(true);
		await flushPromises();

		// The camera then sees the picked code: not handled again.
		expect(gate('pubkyauth://a', handler)).toBe(false);

		expect(gate('pubkyauth://b', handler, { skipCooldown: true })).toBe(true);
		await flushPromises();
		expect(gate('pubkyauth://b', handler)).toBe(false);
		expect(handler).toHaveBeenCalledTimes(3);
	});

	it('reopens the gate when a handler never settles', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const gate = createScanGate();
		const hanging = jest.fn(() => new Promise<void>(() => {}));
		const handler = jest.fn();

		gate('pubkyauth://a', hanging);
		jest.advanceTimersByTime(SCAN_TIMEOUT_MS - 1);
		expect(gate('pubkyauth://b', handler)).toBe(false);

		jest.advanceTimersByTime(1);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(gate('pubkyauth://b', handler)).toBe(true);
		expect(handler).toHaveBeenCalledTimes(1);

		warn.mockRestore();
	});

	it('does not let a timed-out scan reopen the gate during a newer scan', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const gate = createScanGate();
		const late = deferredHandler();
		const current = deferredHandler();
		const handler = jest.fn();

		gate('pubkyauth://a', late.handler);
		jest.advanceTimersByTime(SCAN_TIMEOUT_MS);
		expect(gate('pubkyauth://b', current.handler)).toBe(true);

		late.resolve();
		await flushPromises();
		expect(gate('pubkyauth://c', handler)).toBe(false);

		// The old watchdog was cleared, so only the newer scan's own timeout applies.
		current.resolve();
		await flushPromises();
		expect(gate('pubkyauth://c', handler)).toBe(true);
		expect(warn).toHaveBeenCalledTimes(1);

		warn.mockRestore();
	});

	it('treats a timed-out code as just seen so a held code is not handled twice', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const gate = createScanGate();
		const hanging = jest.fn(() => new Promise<void>(() => {}));

		gate('pubkyring://migrate?index=0&total=1&key=k', hanging);
		for (let elapsed = SCAN_THROTTLE_MS; elapsed <= SCAN_TIMEOUT_MS + 5000; elapsed += SCAN_THROTTLE_MS) {
			jest.advanceTimersByTime(SCAN_THROTTLE_MS);
			gate('pubkyring://migrate?index=0&total=1&key=k', hanging);
		}
		expect(warn).toHaveBeenCalledTimes(1);
		expect(hanging).toHaveBeenCalledTimes(1);

		const handler = jest.fn();
		expect(gate('pubkyauth://b', handler)).toBe(true);
		expect(handler).toHaveBeenCalledTimes(1);

		warn.mockRestore();
	});

	it('reports when it is busy', async () => {
		const onBusyChange = jest.fn();
		const gate = createScanGate({ onBusyChange });
		const { handler, resolve } = deferredHandler();

		gate('pubkyauth://a', handler);
		expect(onBusyChange.mock.calls).toEqual([[true]]);

		resolve();
		await flushPromises();
		expect(onBusyChange.mock.calls).toEqual([[true], [false]]);
	});

	it('releases the gate when the handler fails', async () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
		const gate = createScanGate();
		const failing = jest.fn(() => Promise.reject(new Error('boom')));
		const throwing = jest.fn(() => {
			throw new Error('sync boom');
		});

		gate('pubkyauth://a', failing);
		await flushPromises();
		expect(gate('pubkyauth://b', throwing)).toBe(true);
		expect(gate('pubkyauth://c', failing)).toBe(true);
		await flushPromises();
		expect(consoleError).toHaveBeenCalledTimes(3);

		consoleError.mockRestore();
	});

	it('leaves no timers pending after a scan finishes', async () => {
		const gate = createScanGate();

		gate('pubkyauth://a', jest.fn());
		await flushPromises();

		expect(jest.getTimerCount()).toBe(0);
	});
});
