import { isIPv6 } from 'net';
import { isValidIpv6, PkdnsRecord, PkdnsRecordDraft, validateRecordDraft } from '../src/utils/pkdnsRecords';

const draft = (overrides: Partial<PkdnsRecordDraft> = {}): PkdnsRecordDraft => ({
	name: '@',
	type: 'A',
	ttl: 60,
	value: '192.0.2.1',
	priority: '10',
	...overrides,
});

describe('validateRecordDraft', () => {
	it.each<[string, Partial<PkdnsRecordDraft>, ReturnType<typeof validateRecordDraft>]>([
		[
			'an A record at the pubky',
			{},
			{ valid: true, record: { name: '@', type: 'A', ttl: 60, value: '192.0.2.1' } },
		],
		[
			'an empty name as the pubky',
			{ name: ' ' },
			{ valid: true, record: { name: '@', type: 'A', ttl: 60, value: '192.0.2.1' } },
		],
		[
			'a normalised label',
			{ name: 'WWW.' },
			{ valid: true, record: { name: 'www', type: 'A', ttl: 60, value: '192.0.2.1' } },
		],
		[
			'a wildcard',
			{ name: '*.docs' },
			{ valid: true, record: { name: '*.docs', type: 'A', ttl: 60, value: '192.0.2.1' } },
		],
		['an inner wildcard', { name: 'docs.*' }, { valid: false, errors: { name: 'nameInvalid' } }],
		['an empty label', { name: 'a..b' }, { valid: false, errors: { name: 'nameInvalid' } }],
		['the homeserver name', { name: '_pubky' }, { valid: false, errors: { name: 'nameReserved' } }],
		['a missing value', { value: ' ' }, { valid: false, errors: { value: 'valueRequired' } }],
		['an invalid IPv4', { value: '256.0.0.1' }, { valid: false, errors: { value: 'ipv4Invalid' } }],
		[
			'an IPv6 address',
			{ type: 'AAAA', value: '2001:DB8::1' },
			{ valid: true, record: { name: '@', type: 'AAAA', ttl: 60, value: '2001:db8::1' } },
		],
		['IPv4 in an AAAA record', { type: 'AAAA' }, { valid: false, errors: { value: 'ipv6Invalid' } }],
		[
			'a CNAME target',
			{ name: 'www', type: 'CNAME', value: 'Example.com.' },
			{ valid: true, record: { name: 'www', type: 'CNAME', ttl: 60, value: 'example.com' } },
		],
		[
			'an invalid domain',
			{ type: 'CNAME', value: 'not a domain' },
			{ valid: false, errors: { value: 'domainInvalid' } },
		],
		[
			'MX with the default priority',
			{ type: 'MX', value: 'mail.example.com', priority: '' },
			{ valid: true, record: { name: '@', type: 'MX', ttl: 60, value: 'mail.example.com', priority: 10 } },
		],
		[
			'MX with an invalid priority',
			{ type: 'MX', value: 'mail.example.com', priority: '70000' },
			{ valid: false, errors: { priority: 'priorityInvalid' } },
		],
		[
			'TXT kept verbatim',
			{ type: 'TXT', value: ' v=1 ' },
			{ valid: true, record: { name: '@', type: 'TXT', ttl: 60, value: ' v=1 ' } },
		],
	])('%s', (_, overrides, expected) => {
		expect(validateRecordDraft(draft(overrides), [])).toEqual(expected);
	});

	it('keeps a CNAME alone at its name', () => {
		const a: PkdnsRecord = { name: 'www', type: 'A', ttl: 60, value: '192.0.2.1' };
		const cname: PkdnsRecord = { name: 'www', type: 'CNAME', ttl: 60, value: 'example.com' };
		const conflict = { valid: false, errors: { name: 'cnameConflict' } };

		expect(validateRecordDraft(draft({ name: 'www', type: 'CNAME', value: 'example.com' }), [a])).toEqual(
			conflict,
		);
		expect(validateRecordDraft(draft({ name: 'www' }), [cname])).toEqual(conflict);
		expect(
			validateRecordDraft(draft({ name: 'www', type: 'CNAME', value: 'example.com' }), [cname]).valid,
		).toBe(true);
	});
});

it('accepts the IPv6 addresses Node accepts, without zone ids', () => {
	const addresses = [
		'::',
		'::1',
		'1::',
		'2001:db8::1',
		'1:2:3:4:5:6:7:8',
		'::ffff:192.0.2.1',
		'1:2:3:4:5:6:1.2.3.4',
	];
	const invalid = [
		'1:2:3:4:5:6:7',
		'1:2:3:4:5:6:7:8:9',
		'1::2::3',
		':1::',
		'12345::',
		'g::1',
		'::1.2.3.256',
		'1.2.3.4',
	];
	for (const address of [...addresses, ...invalid]) {
		expect([address, isValidIpv6(address)]).toEqual([address, isIPv6(address)]);
	}
});
