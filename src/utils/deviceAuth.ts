import { AppState, NativeModules } from 'react-native';
import { getStore } from './store-helpers';
import i18n from '../i18n';

type DeviceAuthenticationModule = {
	getAvailability: () => Promise<{ available: boolean; biometry: 'face' | 'touch' | 'none' }>;
	authenticate: (id: string, reason: string, cancel: string, fallback: string) => Promise<boolean>;
	cancel: (id: string) => void;
	openEnrollment: () => Promise<void>;
};

export class DeviceAuthError extends Error {
	constructor(public readonly code: 'cancelled' | 'unavailable' | 'busy' | 'failed') {
		super(i18n.t(`deviceAuth.${code}`));
		this.name = 'DeviceAuthError';
	}
}

let nextRequestId = 0;
let activeRequest: string | undefined;
let activeSignal: AbortSignal | undefined;
const PROMPT_TIMEOUT_MS = 60000;

const nativeAuth = (): DeviceAuthenticationModule => {
	const module = NativeModules.DeviceAuthentication as DeviceAuthenticationModule | undefined;
	if (!module) throw new DeviceAuthError('unavailable');
	return module;
};

export const isDeviceAuthRequired = (): boolean => getStore().settings.requireDeviceAuth ?? false;
export const isDeviceAuthPromptActive = (signal?: AbortSignal): boolean =>
	activeRequest !== undefined && (!signal || signal === activeSignal);

export const assertNotAborted = (signal?: AbortSignal): void => {
	if (signal?.aborted || (AppState.currentState === 'background' && !isDeviceAuthPromptActive(signal))) {
		throw new DeviceAuthError('cancelled');
	}
};

export const waitForActiveRequest = async <T>(work: Promise<T>, signal: AbortSignal): Promise<T> => {
	// Always attach a rejection handler to work, even if it was cancelled just before this call.
	let onAbort: () => void = () => {};
	try {
		const result = await Promise.race([
			work,
			new Promise<never>((_, reject) => {
				onAbort = () => reject(new DeviceAuthError('cancelled'));
				signal.addEventListener('abort', onAbort, { once: true });
				if (signal.aborted) onAbort();
			}),
		]);
		assertNotAborted(signal);
		return result;
	} finally {
		signal.removeEventListener('abort', onAbort);
	}
};

export const getDeviceAuthAvailability = (): ReturnType<DeviceAuthenticationModule['getAvailability']> =>
	nativeAuth().getAvailability();

export const openDeviceAuthSettings = (): Promise<void> => nativeAuth().openEnrollment();

/** A fresh OS challenge. No successful result is cached or reusable by another operation. */
export const authenticateDevice = async (reason: string, signal?: AbortSignal): Promise<void> => {
	assertNotAborted(signal);
	if (activeRequest) throw new DeviceAuthError('busy');
	const module = nativeAuth();
	const id = String(++nextRequestId);
	activeRequest = id;
	activeSignal = signal;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let onAbort: () => void = () => {};
	try {
		const cancelled = new Promise<never>((_, reject) => {
			onAbort = (): void => {
				module.cancel(id);
				reject(new DeviceAuthError('cancelled'));
			};
			signal?.addEventListener('abort', onAbort, { once: true });
			timer = setTimeout(onAbort, PROMPT_TIMEOUT_MS);
		});
		const success = await Promise.race([
			module.authenticate(id, reason, i18n.t('common.cancel'), i18n.t('deviceAuth.usePasscode')),
			cancelled,
		]);
		assertNotAborted(signal);
		if (AppState.currentState === 'background') throw new DeviceAuthError('cancelled');
		if (!success) throw new DeviceAuthError('failed');
	} catch (error) {
		if (error instanceof DeviceAuthError) throw error;
		const code = (error as { code?: string })?.code;
		throw new DeviceAuthError(
			code === 'cancelled' || code === 'unavailable' || code === 'busy' ? code : 'failed',
		);
	} finally {
		clearTimeout(timer);
		signal?.removeEventListener('abort', onAbort);
		if (activeRequest === id) {
			activeRequest = undefined;
			activeSignal = undefined;
		}
	}
};

export const requireDeviceAuthentication = async (reason: string, signal?: AbortSignal): Promise<void> => {
	assertNotAborted(signal);
	if (isDeviceAuthRequired()) await authenticateDevice(reason, signal);
	assertNotAborted(signal);
};
