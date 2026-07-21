import { NativeModules, Platform } from 'react-native';
import { getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';

export interface SharedPubkyIdentity {
	pubky: string;
	secretKey: string;
}

interface NativeSharedPubkyIdentity {
	pubky?: unknown;
	secretKey?: unknown;
	secret_key?: unknown;
}

interface SharedPubkyNativeModule {
	mirror(pubky: string, secretKey: string): Promise<void>;
	remove(pubky: string): Promise<void>;
	discover(): Promise<NativeSharedPubkyIdentity[]>;
}

const nativeModule = (): SharedPubkyNativeModule | undefined =>
	Platform.OS === 'android' ? (NativeModules.SharedPubky as SharedPubkyNativeModule | undefined) : undefined;

export const mirrorSharedPubky = async (pubky: string, secretKey: string): Promise<void> => {
	try {
		await nativeModule()?.mirror(pubky, secretKey);
	} catch {
		// Sharing is best-effort and must never affect Ring's own key storage.
	}
};

export const removeSharedPubky = async (pubky: string): Promise<void> => {
	try {
		await nativeModule()?.remove(pubky);
	} catch {
		// Sharing is best-effort and must never affect Ring's own key storage.
	}
};

export const discoverSharedPubkys = async (ownedPubkys: string[]): Promise<SharedPubkyIdentity[]> => {
	const module = nativeModule();
	if (!module) return [];

	try {
		const rows = await module.discover();
		if (!Array.isArray(rows)) return [];

		const owned = new Set(ownedPubkys);
		const discovered = new Map<string, SharedPubkyIdentity>();
		for (const row of rows) {
			const pubky = typeof row?.pubky === 'string' ? row.pubky : '';
			const rawSecretKey = row?.secretKey ?? row?.secret_key;
			const secretKey = typeof rawSecretKey === 'string' ? rawSecretKey : '';
			if (!pubky || !secretKey || owned.has(pubky) || discovered.has(pubky)) continue;

			const derived = await getPublicKeyFromSecretKey(secretKey);
			if (derived.isOk() && derived.value.public_key === pubky) {
				discovered.set(pubky, { pubky, secretKey });
			}
		}
		return [...discovered.values()];
	} catch {
		return [];
	}
};
