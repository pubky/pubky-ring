import { err, ok } from '@synonymdev/result';
import { loadPkdnsRecords, PkdnsError, publishPkdnsChanges, republishPkdnsPackets } from '../src/utils/pkdns';
import { clearPkdnsData, getStoredPacket, setStoredPacket } from '../src/utils/pkdnsStorage';
import { getPubkySecretKey } from '../src/utils/pubky';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';
import { defaultPubkyState } from '../src/store/shapes/pubky';
import type { PkdnsRecord } from '../src/utils/pkdnsRecords';

jest.mock('@synonymdev/react-native-pubky', () => ({
	resolveDnsRecords: jest.fn(),
	editDnsRecords: jest.fn(),
	republishPacket: jest.fn(),
}));
jest.mock('../src/utils/pubky', () => ({ getPubkySecretKey: jest.fn() }));
jest.mock('../src/utils/store-helpers', () => ({ getPubkyDataFromStore: jest.fn() }));

const {
	editDnsRecords: edit,
	resolveDnsRecords: resolve,
	republishPacket: republish,
} = jest.requireMock<Record<'editDnsRecords' | 'resolveDnsRecords' | 'republishPacket', jest.Mock>>(
	'@synonymdev/react-native-pubky',
);
const record: PkdnsRecord = { name: 'www', type: 'A', ttl: 300, value: '192.0.2.1' };
const packet = (signedPacket: string, records: PkdnsRecord[] = []) => ({
	found: true,
	signed_packet: signedPacket,
	packet_size: 120,
	records,
	other_records: 1,
});

beforeEach(() => {
	jest.clearAllMocks();
	clearPkdnsData('key');
	(getPubkySecretKey as jest.Mock).mockResolvedValue(ok({ secretKey: 'secret', mnemonic: '' }));
	(getPubkyDataFromStore as jest.Mock).mockReturnValue({ ...defaultPubkyState, homeserver: 'hs' });
});

it('publishes on top of the stored packet and stores the result', async () => {
	setStoredPacket('key', 'old');
	edit.mockResolvedValue(ok(packet('new', [record])));

	const res = await publishPkdnsChanges({ pubky: 'key', add: [record] });

	expect(edit).toHaveBeenCalledWith('secret', { add: [record], remove: [] }, 'old');
	expect(res.isOk() && res.value.records).toEqual([record]);
	expect(getStoredPacket('key')).toBe('new');
});

it('publishes for a pubky with a homeserver only after its packet was seen', async () => {
	const refused = await publishPkdnsChanges({ pubky: 'key', add: [record] });
	expect(refused.isErr() && (refused.error as PkdnsError).code).toBe('notFound');
	expect(edit).not.toHaveBeenCalled();

	resolve.mockResolvedValue(ok(packet('seen')));
	edit.mockResolvedValue(ok(packet('new', [record])));
	await loadPkdnsRecords('key');
	await publishPkdnsChanges({ pubky: 'key', add: [record] });

	expect(resolve).toHaveBeenCalledWith('key', undefined);
	expect(edit).toHaveBeenCalledWith('secret', { add: [record], remove: [] }, 'seen');
});

it('reports binding failures by error code', async () => {
	setStoredPacket('key', 'old');
	edit.mockResolvedValue(err('PKDNS_PACKET_TOO_LARGE: 1043'));

	const res = await publishPkdnsChanges({ pubky: 'key', add: [record] });

	expect(res.isErr() && (res.error as PkdnsError).code).toBe('packetTooLarge');
	expect(getStoredPacket('key')).toBe('old');
});

it('republishes owned packets at most once an hour', async () => {
	setStoredPacket('key', 'stored');
	republish.mockResolvedValue(ok({ ...packet('latest'), republished: true }));
	const pubkys = { key: defaultPubkyState, external: { ...defaultPubkyState, sourceApp: 'bitkit' } };
	const start = 1_000_000_000_000;

	await republishPkdnsPackets(pubkys, start);
	await republishPkdnsPackets(pubkys, start + 30 * 60 * 1000);
	expect(republish.mock.calls).toEqual([['key', 'stored']]);
	expect(getStoredPacket('key')).toBe('latest');

	await republishPkdnsPackets(pubkys, start + 61 * 60 * 1000);
	expect(republish.mock.calls).toEqual([
		['key', 'stored'],
		['key', 'latest'],
	]);
});
