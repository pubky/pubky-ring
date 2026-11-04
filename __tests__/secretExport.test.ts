import { ok } from '@synonymdev/result';
import { getSecretForExport } from '../src/utils/secretExport';
import { getPubkySecretKey } from '../src/utils/pubky';
import { requireDeviceAuthentication, assertNotAborted } from '../src/utils/deviceAuth';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';

jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../src/utils/pubky', () => ({
	getPubkySecretKey: jest.fn(),
	truncatePubky: (pubky: string) => pubky,
}));
jest.mock('../src/utils/store-helpers', () => ({ getPubkyDataFromStore: jest.fn() }));
jest.mock('../src/utils/deviceAuth', () => ({
	requireDeviceAuthentication: jest.fn(),
	assertNotAborted: jest.fn(signal => {
		if (signal.aborted) throw new Error('cancelled');
	}),
}));

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(getPubkyDataFromStore).mockReturnValue({ sourceApp: undefined } as never);
	jest.mocked(requireDeviceAuthentication).mockResolvedValue(undefined);
	jest.mocked(getPubkySecretKey).mockResolvedValue(ok({ secretKey: 'secret', mnemonic: 'phrase' }));
});

it('authenticates before reading a private key or recovery phrase', async () => {
	await expect(getSecretForExport('identity', new AbortController().signal)).resolves.toEqual({
		secretKey: 'secret',
		mnemonic: 'phrase',
	});
	expect(jest.mocked(requireDeviceAuthentication).mock.invocationCallOrder[0]).toBeLessThan(
		jest.mocked(getPubkySecretKey).mock.invocationCallOrder[0],
	);
});

it('never reads secrets after cancellation or an unsuccessful challenge', async () => {
	jest.mocked(requireDeviceAuthentication).mockRejectedValueOnce(new Error('cancelled'));
	await expect(getSecretForExport('identity', new AbortController().signal)).rejects.toThrow('cancelled');
	expect(getPubkySecretKey).not.toHaveBeenCalled();
});

it('does not return a secret if the screen closes during its retrieval', async () => {
	const request = new AbortController();
	jest.mocked(getPubkySecretKey).mockImplementationOnce(async () => {
		request.abort();
		return ok({ secretKey: 'secret', mnemonic: 'phrase' });
	});
	await expect(getSecretForExport('identity', request.signal)).rejects.toThrow('cancelled');
	expect(assertNotAborted).toHaveBeenCalled();
});

it('refuses to export identities belonging to another app', async () => {
	jest.mocked(getPubkyDataFromStore).mockReturnValue({ sourceApp: 'to.bitkit' } as never);
	await expect(getSecretForExport('identity', new AbortController().signal)).rejects.toThrow(
		'backup.couldNotRetrieveSecretKey',
	);
	expect(getPubkySecretKey).not.toHaveBeenCalled();
});
