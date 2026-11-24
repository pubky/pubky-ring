/**
 * PKDNS records: the DNS records a pubky publishes in its signed pkarr packet,
 * so `<pubky>` and `<label>.<pubky>` resolve through pkdns like a domain.
 *
 * Names are relative to the pubky: `@` is the pubky itself, `*` a wildcard and
 * `www` is `www.<pubky>`. The `_pubky` homeserver record lives in the same
 * packet but is managed by the homeserver settings, never here.
 */

export type PkdnsRecordType = 'A' | 'AAAA' | 'TXT' | 'CNAME' | 'MX';

export type PkdnsRecord = {
	name: string;
	type: PkdnsRecordType;
	/** Seconds. */
	ttl: number;
	value: string;
	/** MX preference; MX records only. */
	priority?: number;
};

export const PKDNS_RECORD_TYPES: PkdnsRecordType[] = ['A', 'AAAA', 'TXT', 'CNAME', 'MX'];

export const PKDNS_TTL_OPTIONS = [
	{ label: '1M', seconds: 60 },
	{ label: '5M', seconds: 300 },
	{ label: '1H', seconds: 3600 },
	{ label: '4H', seconds: 14400 },
	{ label: '8H', seconds: 28800 },
	{ label: '1D', seconds: 86400 },
] as const;

export const DEFAULT_PKDNS_TTL = PKDNS_TTL_OPTIONS[0].seconds;
export const DEFAULT_MX_PRIORITY = 10;
/** A signed packet holds at most this many bytes of DNS records. */
export const PKDNS_PACKET_LIMIT = 1000;
const RESERVED_NAME_PREFIX = '_pubky';

export const formatTtl = (seconds: number): string => {
	const preset = PKDNS_TTL_OPTIONS.find(option => option.seconds === seconds);
	if (preset) return preset.label;
	if (seconds % 86400 === 0) return `${seconds / 86400}D`;
	if (seconds % 3600 === 0) return `${seconds / 3600}H`;
	if (seconds % 60 === 0) return `${seconds / 60}M`;
	return `${seconds}S`;
};

export const isSameRecord = (a: PkdnsRecord, b: PkdnsRecord): boolean =>
	a.name === b.name && a.type === b.type && a.value === b.value && a.priority === b.priority;

const isValidLabel = (label: string): boolean => /^[a-z0-9_]([a-z0-9_-]{0,61}[a-z0-9_])?$/.test(label);

export const isValidIpv4 = (value: string): boolean => {
	const parts = value.split('.');
	return parts.length === 4 && parts.every(part => /^(0|[1-9]\d{0,2})$/.test(part) && Number(part) <= 255);
};

export const isValidIpv6 = (input: string): boolean => {
	let value = input;
	if (value.includes('.')) {
		// An IPv4 tail, e.g. ::ffff:192.0.2.1, stands for the last two groups.
		const lastColon = value.lastIndexOf(':');
		if (lastColon === -1 || !isValidIpv4(value.slice(lastColon + 1))) return false;
		value = `${value.slice(0, lastColon + 1)}0:0`;
	}
	const halves = value.split('::');
	if (halves.length > 2) return false;
	const groups = halves.flatMap(half => (half === '' ? [] : half.split(':')));
	if (!groups.every(group => /^[0-9a-f]{1,4}$/i.test(group))) return false;
	return halves.length === 2 ? groups.length < 8 : groups.length === 8;
};

export const normalizeRecordName = (name: string): string => {
	const trimmed = name.trim().replace(/\.$/, '').toLowerCase();
	return trimmed === '' ? '@' : trimmed;
};

const isValidRecordName = (name: string): boolean => {
	if (name === '@') return true;
	if (name.length > 200) return false;
	return name.split('.').every((label, index) => (label === '*' && index === 0) || isValidLabel(label));
};

export const isValidDomain = (value: string): boolean => {
	const domain = value.replace(/\.$/, '');
	return domain.length > 0 && domain.length <= 253 && domain.split('.').every(isValidLabel);
};

export type PkdnsRecordDraft = {
	name: string;
	type: PkdnsRecordType;
	ttl: number;
	value: string;
	priority: string;
};

export type PkdnsFieldErrorKey =
	| 'nameInvalid'
	| 'nameReserved'
	| 'valueRequired'
	| 'ipv4Invalid'
	| 'ipv6Invalid'
	| 'domainInvalid'
	| 'priorityInvalid'
	| 'cnameConflict';

export type PkdnsDraftValidation =
	| { valid: true; record: PkdnsRecord }
	| {
			valid: false;
			errors: Partial<Record<'name' | 'value' | 'priority', PkdnsFieldErrorKey>>;
	  };

/**
 * Validates a record the user is adding against the records already
 * published. Returns the record in the form the binding expects.
 */
export const validateRecordDraft = (
	draft: PkdnsRecordDraft,
	existing: PkdnsRecord[],
): PkdnsDraftValidation => {
	const errors: Partial<Record<'name' | 'value' | 'priority', PkdnsFieldErrorKey>> = {};
	const name = normalizeRecordName(draft.name);
	if (name.startsWith(RESERVED_NAME_PREFIX)) {
		errors.name = 'nameReserved';
	} else if (!isValidRecordName(name)) {
		errors.name = 'nameInvalid';
	}

	const rawValue = draft.type === 'TXT' ? draft.value : draft.value.trim();
	let value = rawValue;
	if (!rawValue.trim()) {
		errors.value = 'valueRequired';
	} else if (draft.type === 'A' && !isValidIpv4(rawValue)) {
		errors.value = 'ipv4Invalid';
	} else if (draft.type === 'AAAA') {
		if (isValidIpv6(rawValue)) value = rawValue.toLowerCase();
		else errors.value = 'ipv6Invalid';
	} else if (draft.type === 'CNAME' || draft.type === 'MX') {
		if (isValidDomain(rawValue.toLowerCase())) value = rawValue.toLowerCase().replace(/\.$/, '');
		else errors.value = 'domainInvalid';
	}

	let priority: number | undefined;
	if (draft.type === 'MX') {
		const trimmed = draft.priority.trim();
		priority = trimmed === '' ? DEFAULT_MX_PRIORITY : Number(trimmed);
		if (!/^\d*$/.test(trimmed) || !Number.isInteger(priority) || priority > 65535) {
			errors.priority = 'priorityInvalid';
		}
	}

	// A CNAME must be the only record at its name.
	if (!errors.name) {
		const atName = existing.filter(record => record.name === name);
		const conflicts =
			draft.type === 'CNAME'
				? atName.some(record => !(record.type === 'CNAME' && record.value === value))
				: atName.some(record => record.type === 'CNAME');
		if (conflicts) errors.name = 'cnameConflict';
	}

	if (Object.keys(errors).length > 0) return { valid: false, errors };
	return {
		valid: true,
		record: {
			name,
			type: draft.type,
			ttl: draft.ttl,
			value,
			...(priority !== undefined ? { priority } : {}),
		},
	};
};

export const VALUE_PLACEHOLDERS: Record<PkdnsRecordType, string> = {
	A: '192.0.2.1',
	AAAA: '2001:db8::1',
	TXT: 'v=spf1 -all',
	CNAME: 'example.com',
	MX: 'mail.example.com',
};
