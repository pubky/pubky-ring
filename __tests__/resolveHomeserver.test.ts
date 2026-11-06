import { getHomeserver } from '@synonymdev/react-native-pubky';
import { err, ok } from '@synonymdev/result';
import { resolveHomeserver } from '../src/utils/resolveHomeserver';

jest.mock('@synonymdev/react-native-pubky', () => ({ getHomeserver: jest.fn() }));
const lookup = getHomeserver as jest.Mock;

it('returns a normalized public homeserver mapping', async () => {
	lookup.mockResolvedValueOnce(ok(`pubky://${'y'.repeat(52)}`));
	const result = await resolveHomeserver('pubky');
	expect(result.isOk()).toBe(true);
	if (result.isOk()) expect(result.value).toBe('y'.repeat(52));
});
it('distinguishes an absent mapping from a lookup failure', async () => {
	lookup.mockResolvedValueOnce(err('No homeserver found for this public key'));
	const absent = await resolveHomeserver('pubky');
	expect(absent.isOk()).toBe(true);
	if (absent.isOk()) expect(absent.value).toBeUndefined();
	lookup.mockResolvedValueOnce(err('Failed to get homeserver: request timed out'));
	expect((await resolveHomeserver('pubky')).isErr()).toBe(true);
});
it('rejects malformed responses and handles a failed native call', async () => {
	lookup.mockResolvedValueOnce(ok('invalid-key'));
	expect((await resolveHomeserver('pubky')).isErr()).toBe(true);
	lookup.mockRejectedValueOnce(new Error('Offline'));
	expect((await resolveHomeserver('pubky')).isErr()).toBe(true);
});
