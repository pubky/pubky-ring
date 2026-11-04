import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { DeviceAuthError, isDeviceAuthPromptActive } from '../utils/deviceAuth';

/** Cancels pending work when its screen closes; native code owns prompt lifecycle cancellation. */
export const useSensitiveAction = () => {
	const controller = useRef<AbortController | null>(null);
	const mounted = useRef(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	useEffect(() => {
		mounted.current = true;
		const cancelOutsideForeground = (): void => {
			if (!isDeviceAuthPromptActive(controller.current?.signal)) controller.current?.abort();
		};
		const subscription = AppState.addEventListener('change', state => {
			if (state !== 'active') cancelOutsideForeground();
		});
		const blurSubscription =
			Platform.OS === 'android' ? AppState.addEventListener('blur', cancelOutsideForeground) : undefined;
		return () => {
			mounted.current = false;
			controller.current?.abort();
			subscription.remove();
			blurSubscription?.remove();
		};
	}, []);
	const run = useCallback(async (action: (signal: AbortSignal) => Promise<void>): Promise<void> => {
		if (controller.current) return;
		const request = new AbortController();
		controller.current = request;
		setBusy(true);
		setError('');
		try {
			await action(request.signal);
		} catch (failure) {
			if (mounted.current && !(failure instanceof DeviceAuthError && failure.code === 'cancelled')) {
				setError(failure instanceof Error ? failure.message : String(failure));
			}
		} finally {
			controller.current = null;
			if (mounted.current) setBusy(false);
		}
	}, []);
	const cancel = useCallback(() => controller.current?.abort(), []);
	return { run, busy, error, cancel };
};
