import * as ReactNativePubky from '@synonymdev/react-native-pubky';
import { Result, err, ok } from '@synonymdev/result';
import type { TPubkys } from '../types/pubky';
import { getPubkySecretKey } from './pubky';
import { getPubkyDataFromStore } from './store-helpers';
import { getLastRepublishedAt, getStoredPacket, setLastRepublishedAt, setStoredPacket } from './pkdnsStorage';
import type { PkdnsRecord } from './pkdnsRecords';

type DnsRecordsResult = {
	found: boolean;
	signed_packet: string | null;
	packet_size: number;
	records: PkdnsRecord[];
	other_records: number;
};

type PkdnsBindings = {
	resolveDnsRecords?: (publicKey: string, knownPacket?: string) => Promise<Result<DnsRecordsResult>>;
	editDnsRecords?: (
		secretKey: string,
		changes: { add?: PkdnsRecord[]; remove?: PkdnsRecord[] },
		knownPacket?: string,
	) => Promise<Result<DnsRecordsResult>>;
	republishPacket?: (
		publicKey: string,
		knownPacket?: string,
	) => Promise<Result<DnsRecordsResult & { republished: boolean }>>;
};

// Added in react-native-pubky after 0.15.0; PKDNS stays hidden on older bindings.
const pkdnsBindings = ReactNativePubky as typeof ReactNativePubky & PkdnsBindings;

export const isPkdnsSupported = (): boolean =>
	typeof pkdnsBindings.resolveDnsRecords === 'function' && typeof pkdnsBindings.editDnsRecords === 'function';

export type PkdnsErrorCode =
	| 'notFound'
	| 'packetTooLarge'
	| 'cnameConflict'
	| 'reservedName'
	| 'invalidRecord'
	| 'resolveFailed'
	| 'publishFailed'
	| 'conflict'
	| 'secretKey'
	| 'unknown';

export class PkdnsError extends Error {
	constructor(
		readonly code: PkdnsErrorCode,
		message: string = code,
	) {
		super(message);
		this.name = 'PkdnsError';
	}
}

const ERROR_CODES: Record<string, PkdnsErrorCode> = {
	PKDNS_PACKET_TOO_LARGE: 'packetTooLarge',
	PKDNS_CNAME_CONFLICT: 'cnameConflict',
	PKDNS_RESERVED_NAME: 'reservedName',
	PKDNS_INVALID_RECORD: 'invalidRecord',
	PKDNS_INVALID_INPUT: 'invalidRecord',
	PKDNS_RESOLVE_FAILED: 'resolveFailed',
	PKDNS_PUBLISH_FAILED: 'publishFailed',
	PKDNS_CONFLICT: 'conflict',
};

const toPkdnsError = (message: string): PkdnsError => {
	const code = ERROR_CODES[message.split(':')[0]] ?? 'unknown';
	return new PkdnsError(code, message);
};

export type PkdnsSnapshot = {
	/** False when the pubky has never published a packet. */
	found: boolean;
	records: PkdnsRecord[];
	/** Records kept but not shown, such as the homeserver record. */
	otherRecords: number;
	/** Bytes used of PKDNS_PACKET_LIMIT. */
	packetSize: number;
};

const toSnapshot = (result: DnsRecordsResult): PkdnsSnapshot => ({
	found: result.found,
	records: result.records,
	otherRecords: result.other_records,
	packetSize: result.packet_size,
});

export const loadPkdnsRecords = async (pubky: string): Promise<Result<PkdnsSnapshot>> => {
	if (!pkdnsBindings.resolveDnsRecords) return err(new PkdnsError('unknown', 'PKDNS is not supported'));
	const res = await pkdnsBindings.resolveDnsRecords(pubky, getStoredPacket(pubky));
	if (res.isErr()) return err(toPkdnsError(res.error.message));
	setStoredPacket(pubky, res.value.signed_packet);
	return ok(toSnapshot(res.value));
};

/**
 * Publishes added and removed records. Every other record in the pubky's
 * packet, including the homeserver record, is kept by the binding.
 */
export const publishPkdnsChanges = async ({
	pubky,
	add = [],
	remove = [],
}: {
	pubky: string;
	add?: PkdnsRecord[];
	remove?: PkdnsRecord[];
}): Promise<Result<PkdnsSnapshot>> => {
	if (!pkdnsBindings.editDnsRecords) return err(new PkdnsError('unknown', 'PKDNS is not supported'));
	const knownPacket = getStoredPacket(pubky);
	// A pubky with a homeserver has a packet. If Ring has never seen it, the DHT
	// may have dropped it; publishing now would replace the homeserver record.
	if (!knownPacket && getPubkyDataFromStore(pubky)?.homeserver) {
		return err(new PkdnsError('notFound'));
	}
	const secretKeyRes = await getPubkySecretKey(pubky);
	if (secretKeyRes.isErr()) return err(new PkdnsError('secretKey', secretKeyRes.error.message));
	const res = await pkdnsBindings.editDnsRecords(secretKeyRes.value.secretKey, { add, remove }, knownPacket);
	if (res.isErr()) return err(toPkdnsError(res.error.message));
	setStoredPacket(pubky, res.value.signed_packet);
	setLastRepublishedAt(pubky, Date.now());
	return ok(toSnapshot(res.value));
};

export const PKDNS_REPUBLISH_INTERVAL_MS = 60 * 60 * 1000;
let republishing = false;

/**
 * Re-announces each owned pubky's signed packet, unchanged, so its records
 * and homeserver record do not expire from the DHT. Homeservers usually do
 * this too, but only as a courtesy. Runs at most once an hour per pubky.
 */
export const republishPkdnsPackets = async (pubkys: TPubkys, now: number = Date.now()): Promise<void> => {
	if (republishing || !pkdnsBindings.republishPacket) return;
	republishing = true;
	try {
		for (const [pubky, data] of Object.entries(pubkys)) {
			// Another app owns external pubkys and keeps their packets alive.
			if (data.sourceApp || now - getLastRepublishedAt(pubky) < PKDNS_REPUBLISH_INTERVAL_MS) continue;
			const res = await pkdnsBindings.republishPacket(pubky, getStoredPacket(pubky));
			if (res.isErr()) {
				console.warn(`[pkdns] Republishing ${pubky} failed:`, res.error.message);
				continue;
			}
			setStoredPacket(pubky, res.value.signed_packet);
			setLastRepublishedAt(pubky, now);
		}
	} finally {
		republishing = false;
	}
};
