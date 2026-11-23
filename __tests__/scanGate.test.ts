import {
	createScanGate,
	ScanGate,
	ScanHandler,
	SCAN_COOLDOWN_MS,
	SCAN_SEEN_LIMIT,
	SCAN_THROTTLE_MS,
} from '../src/components/Camera/scanGate';

const flush = async (): Promise<void> => {
	await Promise.resolve();
	await Promise.resolve();
};

/** Lets `ms` pass on the fake clock, settling any handlers that finish meanwhile. */
const wait = async (ms: number): Promise<void> => {
	jest.advanceTimersByTime(ms);
	await flush();
};

/** Simulates the camera reading `values` in turn, one per throttle interval, for `ms`. */
const readEvery = async (
	gate: ScanGate,
	values: string[],
	handler: ScanHandler,
	ms: number,
): Promise<void> => {
	for (let i = 0; i * SCAN_THROTTLE_MS < ms; i++) {
		gate(values[i % values.length], handler);
		await wait(SCAN_THROTTLE_MS);
	}
};

/** A handler that settles after `ms` on the fake clock. */
const slowHandler = (ms: number): jest.Mock =>
	jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, ms)));

const handledValues = (...handlers: jest.Mock[]): string[] =>
	handlers.flatMap(handler => handler.mock.calls.map(([value]) => value));

describe('createScanGate', () => {
	let gate: ScanGate;

	beforeEach(() => {
		jest.useFakeTimers();
		gate = createScanGate();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('handles a code held in view once, including while and after its scan runs', async () => {
		const handler = slowHandler(3000);

		await readEvery(gate, ['a'], handler, 10000);

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('does not handle a held code again when its reads pause for 1.7s, as measured on a device', async () => {
		const handler = jest.fn();

		await readEvery(gate, ['a'], handler, 1000);
		// No reads reach JS while it is busy (e.g. importing a migrated key), though the code stays in view.
		await wait(1700);
		await readEvery(gate, ['a'], handler, 3000);

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('handles a different code immediately, but not a code switched back to within the cooldown', async () => {
		const handler = jest.fn();

		expect(gate('a', handler)).toBe(true);
		await flush();
		expect(gate('b', handler)).toBe(true);
		await flush();
		expect(gate('a', handler)).toBe(false);

		expect(handledValues(handler)).toEqual(['a', 'b']);
	});

	it('handles the same code again after it has been out of view for the cooldown', async () => {
		const handler = jest.fn();

		await readEvery(gate, ['a'], handler, 3000);
		await wait(SCAN_COOLDOWN_MS);
		expect(gate('a', handler)).toBe(true);

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('keeps a slow scan exclusive until it settles, warning after 20s', async () => {
		const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const slowImport = slowHandler(30000);
		const other = jest.fn();

		gate('a', slowImport);
		// Deliberate rescans (out of view longer than the cooldown) and another code while it runs.
		await wait(20000);
		expect(gate('a', slowImport)).toBe(false);
		await wait(5000);
		expect(gate('a', slowImport)).toBe(false);
		expect(gate('b', other, { skipCooldown: true })).toBe(false);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(slowImport).toHaveBeenCalledTimes(1);

		// Settles at 30s; a rescan after the cooldown is handled.
		await wait(5000);
		await wait(SCAN_COOLDOWN_MS);
		expect(gate('a', slowImport)).toBe(true);
		expect(other).not.toHaveBeenCalled();
	});

	it('releases the gate when the handler rejects or throws, so a rescan works', async () => {
		const error = jest.spyOn(console, 'error').mockImplementation(() => {});
		const rejecting = jest.fn(() => Promise.reject(new Error('offline')));
		const throwing = jest.fn(() => {
			throw new Error('invalid');
		});

		gate('a', rejecting);
		await flush();
		expect(gate('b', throwing)).toBe(true);
		await wait(SCAN_COOLDOWN_MS);
		expect(gate('a', rejecting)).toBe(true);
		await flush();

		expect(rejecting).toHaveBeenCalledTimes(2);
		expect(error).toHaveBeenCalledTimes(3);
	});

	it('lets a gallery pick skip the cooldown and records it so the camera does not repeat it', async () => {
		const handler = jest.fn();

		gate('a', handler);
		await flush();
		expect(gate('a', handler, { skipCooldown: true })).toBe(true);
		await flush();
		expect(gate('a', handler)).toBe(false);

		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('does not handle a camera code again after a gallery pick of another migration export settles', async () => {
		const twoKeyFrame = 'pubkyring://migrate?index=0&total=2&key=a';
		const threeKeyFrame = 'pubkyring://migrate?index=0&total=3&key=b';
		const camera = jest.fn();
		const pick = slowHandler(3000);

		gate(twoKeyFrame, camera);
		await wait(SCAN_THROTTLE_MS);
		expect(gate(threeKeyFrame, pick, { skipCooldown: true })).toBe(true);
		// The two-key frame stays in view while the pick runs and after it settles.
		await readEvery(gate, [twoKeyFrame], camera, 6000);

		expect(handledValues(camera, pick)).toEqual([twoKeyFrame, threeKeyFrame]);
	});

	it('delivers every frame of a looping animated QR once when the first frame is slow', async () => {
		const frames = ['frame-0', 'frame-1', 'frame-2'];
		const handler = jest.fn(
			(value: string) => new Promise<void>(resolve => setTimeout(resolve, value === 'frame-0' ? 2000 : 50)),
		);

		// One frame per read: the loop (750ms) repeats faster than the cooldown.
		await readEvery(gate, frames, handler, 10000);

		expect(handledValues(handler).sort()).toEqual(frames);
	});

	it('remembers at most SCAN_SEEN_LIMIT handled codes', async () => {
		const handler = jest.fn();

		for (let i = 0; i <= SCAN_SEEN_LIMIT; i++) {
			gate(`code-${i}`, handler);
			await flush();
		}

		// Within the cooldown: the newest is still remembered, the oldest was evicted.
		expect(gate(`code-${SCAN_SEEN_LIMIT}`, handler)).toBe(false);
		expect(gate('code-0', handler)).toBe(true);
	});
});
