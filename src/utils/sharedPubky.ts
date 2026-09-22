import { NativeModules } from 'react-native';
import { getPublicKeyFromSecretKey } from '@synonymdev/react-native-pubky';
import type { Pubky } from '../types/pubky.ts';

export const SHARED_PUBKY_PROTOCOL_VERSION = 1 as const;
export const RING_SOURCE_APP = 'app.pubkyring' as const;
export const BITKIT_SOURCE_APP = 'to.bitkit' as const;

/**
 * A borrowed identity's canonical private key belongs to another app, so Ring never persists,
 * exports or re-homes it. Single source of truth for that check across the UI.
 */
export const isBorrowedPubkyData = (data?: Pick<Pubky, 'sourceApp'> | null): boolean =>
	data?.sourceApp === BITKIT_SOURCE_APP;

export type SharedPubkySourceApp = typeof RING_SOURCE_APP | typeof BITKIT_SOURCE_APP;

export interface SharedPubkyIdentity {
	version: typeof SHARED_PUBKY_PROTOCOL_VERSION;
	sourceApp: SharedPubkySourceApp;
	pubky: string;
	name?: string;
	image?: string;
}

export interface SharedPubkyDiscovery {
	available: boolean;
	identities: SharedPubkyIdentity[];
}

interface SharedPubkyCredential extends SharedPubkyIdentity {
	secretKey: string;
}

interface NativeSharedPubkyIdentity {
	version?: unknown;
	sourceApp?: unknown;
	source_package?: unknown;
	pubky?: unknown;
	secretKey?: unknown;
	secret_key?: unknown;
}

interface NativeSharedPubkyDiscovery {
	available?: unknown;
	identities?: unknown;
}

interface SharedPubkyNativeModule {
	mirror(pubky: string, secretKey: string): Promise<void>;
	remove(pubky: string): Promise<void>;
	reconcile(identities: Array<{ pubky: string; secretKey: string }>): Promise<void>;
	clear(): Promise<void>;
	list(): Promise<NativeSharedPubkyDiscovery>;
	credential(pubky: string): Promise<NativeSharedPubkyIdentity>;
}

const PUBKY_PATTERN = /^[ybndrfg8ejkmcpqxot1uwisza345h769]{52}$/;
const SECRET_KEY_PATTERN = /^[0-9a-f]{64}$/;
let identityLifecycleTail: Promise<void> = Promise.resolve();

/**
 * Serializes changes spanning Ring's private source, shared mirror, and persisted reference state.
 * Callers must keep the complete durable transaction inside this gate.
 */
export const withPubkyIdentityLifecycle = async <T>(operation: () => Promise<T>): Promise<T> => {
	let release: () => void = () => {};
	const previous = identityLifecycleTail;
	identityLifecycleTail = new Promise<void>(resolve => {
		release = resolve;
	});

	await previous;
	try {
		return await operation();
	} finally {
		release();
	}
};

export const normalizeSharedPubky = (value: unknown): string | undefined => {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	if (PUBKY_PATTERN.test(trimmed)) return trimmed;
	const raw = trimmed.length === 57 && trimmed.startsWith('pubky') ? trimmed.slice(5) : '';
	return PUBKY_PATTERN.test(raw) ? raw : undefined;
};

export const canonicalSharedPubky = (value: unknown): string | undefined =>
	typeof value === 'string' && PUBKY_PATTERN.test(value) ? value : undefined;

export const privatePubkyService = (service: string): { service: string; pubky: string } | undefined => {
	const pubky = normalizeSharedPubky(service);
	return pubky ? { service, pubky } : undefined;
};

export const isValidSharedSecretKey = (value: unknown): value is string =>
	typeof value === 'string' && SECRET_KEY_PATTERN.test(value);

const nativeModule = (): SharedPubkyNativeModule | undefined =>
	NativeModules.SharedPubky as SharedPubkyNativeModule | undefined;

export const mirrorSharedPubky = async (pubky: string, secretKey: string): Promise<boolean> => {
	const module = nativeModule();
	const normalized = normalizeSharedPubky(pubky);
	if (!module || !normalized || !isValidSharedSecretKey(secretKey)) return false;
	try {
		await module.mirror(normalized, secretKey);
		return true;
	} catch {
		// The private source remains canonical. Reconciliation will retry this mirror later.
		return false;
	}
};

export const removeSharedPubky = async (pubky: string): Promise<boolean> => {
	const module = nativeModule();
	const normalized = normalizeSharedPubky(pubky);
	if (!module || !normalized) return false;
	try {
		await module.remove(normalized);
		return true;
	} catch {
		return false;
	}
};

export const clearOwnedSharedPubkys = async (): Promise<boolean> => {
	const module = nativeModule();
	if (!module) return false;
	try {
		await module.clear();
		return true;
	} catch {
		return false;
	}
};

export const reconcileSharedPubkys = async (
	identities: Array<{ pubky: string; secretKey: string }>,
): Promise<boolean> => {
	const module = nativeModule();
	if (!module) return false;
	const normalized = identities.map(identity => ({
		pubky: normalizeSharedPubky(identity.pubky),
		secretKey: identity.secretKey,
	}));
	if (normalized.some(identity => !identity.pubky || !isValidSharedSecretKey(identity.secretKey))) {
		return false;
	}
	try {
		await module.reconcile(normalized as Array<{ pubky: string; secretKey: string }>);
		return true;
	} catch {
		return false;
	}
};

const parsePublicIdentity = (row: NativeSharedPubkyIdentity): SharedPubkyIdentity | undefined => {
	const version = row?.version;
	const sourceApp = row?.sourceApp ?? row?.source_package;
	const pubky = canonicalSharedPubky(row?.pubky);
	if (version !== SHARED_PUBKY_PROTOCOL_VERSION || sourceApp !== BITKIT_SOURCE_APP || pubky === undefined) {
		return undefined;
	}
	return { version, sourceApp, pubky };
};

export const discoverSharedPubkys = async (ownedPubkys: string[]): Promise<SharedPubkyDiscovery> => {
	const module = nativeModule();
	if (!module) throw new Error('Shared Pubky discovery is unavailable');

	const response = await module.list();
	if (typeof response?.available !== 'boolean' || !Array.isArray(response.identities)) {
		throw new Error('Invalid Shared Pubky discovery response');
	}
	if (!response.available) return { available: false, identities: [] };

	const owned = new Set(ownedPubkys.map(normalizeSharedPubky).filter((value): value is string => !!value));
	const discovered = new Map<string, SharedPubkyIdentity>();
	for (const raw of response.identities) {
		if (!raw || typeof raw !== 'object') continue;
		const identity = parsePublicIdentity(raw as NativeSharedPubkyIdentity);
		if (!identity || owned.has(identity.pubky) || discovered.has(identity.pubky)) continue;
		discovered.set(identity.pubky, identity);
	}
	return {
		available: true,
		identities: [...discovered.values()].sort((left, right) => left.pubky.localeCompare(right.pubky)),
	};
};

export const getSharedPubkyCredential = async (
	identity: Pick<SharedPubkyIdentity, 'pubky' | 'sourceApp'>,
): Promise<SharedPubkyCredential | undefined> => {
	const module = nativeModule();
	const normalized = normalizeSharedPubky(identity.pubky);
	if (identity.sourceApp !== BITKIT_SOURCE_APP || !normalized) return undefined;
	if (!module) throw new Error('Shared Pubky credential lookup is unavailable');

	try {
		const raw = await module.credential(normalized);
		const parsed = parsePublicIdentity(raw);
		const secretKey = raw?.secretKey ?? raw?.secret_key;
		if (!parsed || parsed.pubky !== normalized || !isValidSharedSecretKey(secretKey)) {
			return undefined;
		}
		const derived = await getPublicKeyFromSecretKey(secretKey);
		if (!derived.isOk()) throw new Error('Shared Pubky credential validation failed');
		const derivedPubky = normalizeSharedPubky(derived.value.public_key);
		if (derivedPubky !== normalized) return undefined;
		return { ...parsed, secretKey };
	} catch (error) {
		// Only a definitive absence/invalid record disconnects an existing borrowed identity.
		// Keychain/provider failures reject so callers refuse this operation but retain the identity.
		const code = (error as { code?: string } | null)?.code;
		if (code === 'credential_missing' || code === 'source_unavailable' || code === 'invalid_credential') {
			return undefined;
		}
		throw error;
	}
};
