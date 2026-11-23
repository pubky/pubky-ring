import {
	createScanGate,
	SCAN_COOLDOWN_MS,
	SCAN_THROTTLE_MS,
	SCAN_SEEN_LIMIT,
	SCAN_SLOW_WARNING_MS,
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
		expect(handler.mock.calls).toEqual([['pubkyauth://a'], ['pubkyauth://b']]);
	});

	it('remembers each handled value separately', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		gate('pubkyauth://a', handler);
		await flushPromises();
		gate('pubkyauth://b', handler);
		await flushPromises();

		// Switching back to a code handled within the cooldown does not handle it again.
		expect(gate('pubkyauth://a', handler)).toBe(false);

		// Once it has been out of view for the cooldown, it is handled again.
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS);
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

	it('keeps the gate closed and only warns when a handler never settles', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const onBusyChange = jest.fn();
		const gate = createScanGate({ onBusyChange });
		const hanging = jest.fn(() => new Promise<void>(() => {}));
		const handler = jest.fn();

		gate('pubkyauth://a', hanging);
		jest.advanceTimersByTime(SCAN_SLOW_WARNING_MS - 1);
		expect(warn).not.toHaveBeenCalled();

		jest.advanceTimersByTime(1);
		expect(warn).toHaveBeenCalledTimes(1);

		jest.advanceTimersByTime(SCAN_SLOW_WARNING_MS * 3);
		expect(gate('pubkyauth://a', hanging)).toBe(false);
		expect(gate('pubkyauth://b', handler)).toBe(false);
		expect(gate('pubkyauth://b', handler, { skipCooldown: true })).toBe(false);
		expect(hanging).toHaveBeenCalledTimes(1);
		expect(handler).not.toHaveBeenCalled();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(onBusyChange.mock.calls).toEqual([[true]]);

		warn.mockRestore();
	});

	it('does not start a second slow import when the same code is rescanned', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const gate = createScanGate();
		const code = 'pubkyring://migrate?index=0&total=1&key=k';
		const slowImport = jest.fn(
			() =>
				new Promise<void>(resolve => {
					setTimeout(resolve, 30000);
				}),
		);

		gate(code, slowImport);
		// Deliberate rescans after the code was out of view for longer than the cooldown.
		jest.advanceTimersByTime(20000);
		expect(gate(code, slowImport)).toBe(false);
		jest.advanceTimersByTime(5000);
		expect(gate(code, slowImport)).toBe(false);
		expect(slowImport).toHaveBeenCalledTimes(1);

		// The import settles at 30s; a rescan after the cooldown is handled again.
		jest.advanceTimersByTime(5000);
		await flushPromises();
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS);
		expect(gate(code, slowImport)).toBe(true);
		expect(slowImport).toHaveBeenCalledTimes(2);

		warn.mockRestore();
	});

	it('handles a rescan of the same code after the cooldown when the handler failed', async () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
		const onBusyChange = jest.fn();
		const gate = createScanGate({ onBusyChange });
		const failing = jest.fn(() => Promise.reject(new Error('offline')));

		gate('pubkyauth://a', failing);
		await flushPromises();
		expect(onBusyChange.mock.calls).toEqual([[true], [false]]);

		jest.advanceTimersByTime(SCAN_COOLDOWN_MS);
		expect(gate('pubkyauth://a', failing)).toBe(true);
		expect(failing).toHaveBeenCalledTimes(2);
		await flushPromises();

		consoleError.mockRestore();
	});

	it('does not let a code still in view replace a gallery pick after it settles', async () => {
		const gate = createScanGate();
		const twoKeyFrame = 'pubkyring://migrate?index=0&total=2&key=a';
		const threeKeyFrame = 'pubkyring://migrate?index=0&total=3&key=b';
		const camera = jest.fn();
		const pick = deferredHandler();
		const handled = (): string[] =>
			[...camera.mock.calls, ...pick.handler.mock.calls].map(([value]) => value);

		// 1. The camera reads frame 1 of the two-key export.
		gate(twoKeyFrame, camera);
		await flushPromises();

		// 2. The user picks frame 1 of the three-key export from the gallery.
		jest.advanceTimersByTime(SCAN_THROTTLE_MS);
		expect(gate(threeKeyFrame, pick.handler, { skipCooldown: true })).toBe(true);

		// 3. The camera keeps reading the two-key frame while the pick is handled.
		for (let elapsed = 0; elapsed < 3000; elapsed += SCAN_THROTTLE_MS) {
			jest.advanceTimersByTime(SCAN_THROTTLE_MS);
			expect(gate(twoKeyFrame, camera)).toBe(false);
		}

		// 4. Once the pick settles, the two-key frame still in view is not handled again.
		pick.resolve();
		await flushPromises();
		for (let elapsed = 0; elapsed < 3000; elapsed += SCAN_THROTTLE_MS) {
			jest.advanceTimersByTime(SCAN_THROTTLE_MS);
			expect(gate(twoKeyFrame, camera)).toBe(false);
		}

		expect(handled()).toEqual([twoKeyFrame, threeKeyFrame]);
		expect(camera).toHaveBeenCalledTimes(1);
	});

	it('delivers every frame of an animated QR when the first frame is slow', async () => {
		const gate = createScanGate();
		const frames = [0, 1, 2].map(index => `pubkyring://migrate?index=${index}&total=3&key=k${index}`);
		const handler = jest.fn(
			(value: string) =>
				new Promise<void>(resolve => {
					setTimeout(resolve, value === frames[0] ? 2000 : 50);
				}),
		);

		// The animation shows one frame per camera read and loops every 750ms,
		// faster than the cooldown, so frames 1 and 2 keep reappearing while frame 0 is handled.
		for (let read = 0; read * SCAN_THROTTLE_MS < 10000; read++) {
			gate(frames[read % frames.length], handler);
			await flushPromises();
			jest.advanceTimersByTime(SCAN_THROTTLE_MS);
			await flushPromises();
		}

		expect(handler.mock.calls.map(([value]) => value).sort()).toEqual([...frames].sort());
		expect(handler).toHaveBeenCalledTimes(3);
	});

	it('forgets the oldest handled value beyond the size limit', async () => {
		const gate = createScanGate({ seenLimit: 3 });
		const handler = jest.fn();

		for (const value of ['a', 'b', 'c', 'd']) {
			expect(gate(value, handler)).toBe(true);
			await flushPromises();
		}

		// Within the cooldown: 'a' was evicted, 'd' is still remembered.
		expect(gate('d', handler)).toBe(false);
		expect(gate('a', handler)).toBe(true);
		expect(handler).toHaveBeenCalledTimes(5);
	});

	it('stays bounded by default when many codes are handled within the cooldown', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		for (let i = 0; i <= SCAN_SEEN_LIMIT; i++) {
			gate(`code-${i}`, handler);
			await flushPromises();
		}

		// The first code was evicted, the most recent one is still remembered.
		expect(gate(`code-${SCAN_SEEN_LIMIT}`, handler)).toBe(false);
		expect(gate('code-0', handler)).toBe(true);
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
