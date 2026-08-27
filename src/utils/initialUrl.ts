import { Linking, NativeModules } from 'react-native';

type InitialUrlModule = {
	consumePendingDeepLinks?: () => Promise<string[]>;
};

let fallbackInitialUrlConsumed = false;

const getNativeInitialUrlModule = (): InitialUrlModule | undefined =>
	NativeModules.InitialUrl as InitialUrlModule | undefined;

export const hasNativeInitialUrlInbox = (): boolean =>
	typeof getNativeInitialUrlModule()?.consumePendingDeepLinks === 'function';

/**
 * Returns the URLs that opened the current Activity. Android consumes an Activity-owned inbox so a
 * root remount cannot replay a URL. Other platforms retain the standard Linking behavior.
 */
export const consumeInitialUrls = async (): Promise<string[]> => {
	const nativeModule = getNativeInitialUrlModule();
	if (nativeModule?.consumePendingDeepLinks) {
		return nativeModule.consumePendingDeepLinks();
	}

	if (fallbackInitialUrlConsumed) return [];
	fallbackInitialUrlConsumed = true;

	try {
		const url = await Linking.getInitialURL();
		return url ? [url] : [];
	} catch (error) {
		fallbackInitialUrlConsumed = false;
		throw error;
	}
};

/**
 * Returns the URLs represented by a live Linking event. Android drains the native inbox that was
 * filled before React Native emitted the event. Other platforms use the event URL directly.
 */
export const consumeUrlEvent = async (url: string): Promise<string[]> => {
	const nativeModule = getNativeInitialUrlModule();
	if (nativeModule?.consumePendingDeepLinks) {
		return nativeModule.consumePendingDeepLinks();
	}

	return [url];
};
