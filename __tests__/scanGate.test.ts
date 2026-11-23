import { createScanGate, SCAN_COOLDOWN_MS } from '../src/components/Camera/scanGate';

const flushPromises = async (): Promise<void> => {
	await Promise.resolve();
	await Promise.resolve();
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

	it('handles the same value again after the cooldown', async () => {
		const gate = createScanGate();
		const handler = jest.fn();

		gate('pubkyauth://a', handler);
		await flushPromises();

		jest.advanceTimersByTime(SCAN_COOLDOWN_MS);
		expect(gate('pubkyauth://a', handler)).toBe(true);
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('ignores every read while a scan is in flight', async () => {
		const gate = createScanGate();
		let resolveScan: () => void = () => {};
		const handler = jest.fn(
			() =>
				new Promise<void>(resolve => {
					resolveScan = resolve;
				}),
		);

		gate('pubkyauth://a', handler);
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS * 2);
		expect(gate('pubkyauth://a', handler)).toBe(false);
		expect(gate('pubkyauth://b', handler)).toBe(false);
		expect(handler).toHaveBeenCalledTimes(1);

		resolveScan();
		await flushPromises();
		expect(gate('pubkyauth://b', handler)).toBe(true);
		expect(handler).toHaveBeenCalledTimes(2);
	});

	it('starts the cooldown when the scan finishes', async () => {
		const gate = createScanGate();
		let resolveScan: () => void = () => {};
		const handler = jest.fn(
			() =>
				new Promise<void>(resolve => {
					resolveScan = resolve;
				}),
		);

		gate('pubkyauth://a', handler);
		jest.advanceTimersByTime(SCAN_COOLDOWN_MS * 2);
		resolveScan();
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
});
