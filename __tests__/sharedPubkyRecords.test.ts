import Keychain from 'react-native-keychain';
import { showToast } from '@synonymdev/react-native-toast';
import { err, ok } from '@synonymdev/result';
import { wipeKeychain } from '../src/utils/keychain';
import { adoptExternalPubky, deletePubky, pruneMissingExternalPubkys } from '../src/utils/pubky';
import { listExternalPubkys, unpublishAllOwnedPubkys, unpublishOwnedPubky } from '../src/utils/sharedPubky';
import { SHARED_PUBKY_SERVICE } from '../src/utils/constants';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';
import { defaultPubkyState } from '../src/store/shapes/pubky';
import { TPubkys } from '../src/types/pubky';

jest.mock('@synonymdev/react-native-pubky');

jest.mock('react-native-keychain', () => ({
	__esModule: true,
	default: {
		getAllGenericPasswordServices: jest.fn(async () => []),
		resetGenericPassword: jest.fn(async () => true),
	},
}));

jest.mock('uuid', () => ({
	__esModule: true,
	v5: jest.fn(() => 'session-id'),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('../src/utils/sharedPubky', () => ({
	__esModule: true,
	listExternalPubkys: jest.fn(),
	publishOwnedPubky: jest.fn(async () => undefined),
	unpublishAllOwnedPubkys: jest.fn(),
	unpublishOwnedPubky: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	addProcessing: jest.fn(payload => ({ type: 'pubky/addProcessing', payload })),
	addPubky: jest.fn(payload => ({ type: 'pubky/addPubky', payload })),
	addSession: jest.fn(payload => ({ type: 'pubky/addSession', payload })),
	removeProcessing: jest.fn(payload => ({ type: 'pubky/removeProcessing', payload })),
	removePubky: jest.fn(payload => ({ type: 'pubky/removePubky', payload })),
	removeSession: jest.fn(payload => ({ type: 'pubky/removeSession', payload })),
	setHomeserver: jest.fn(payload => ({ type: 'pubky/setHomeserver', payload })),
	setPubkyData: jest.fn(payload => ({ type: 'pubky/setPubkyData', payload })),
	setSignedUp: jest.fn(payload => ({ type: 'pubky/setSignedUp', payload })),
}));

jest.mock('../src/utils/helpers.ts', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(async () => true),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getPubkyDataFromStore: jest.fn(),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

const PUBKY = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
const EXTERNAL_PUBKY = 'pbkdgr9ubmtpkrx9zjsgxhxd6zfkmqg1tgmnh1ysnnhzuxeaikoy';

const getAllGenericPasswordServicesMock = Keychain.getAllGenericPasswordServices as jest.Mock;
const resetGenericPasswordMock = Keychain.resetGenericPassword as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	getAllGenericPasswordServicesMock.mockResolvedValue([PUBKY, SHARED_PUBKY_SERVICE]);
	resetGenericPasswordMock.mockResolvedValue(true);
	(unpublishAllOwnedPubkys as jest.Mock).mockResolvedValue(ok(undefined));
	(unpublishOwnedPubky as jest.Mock).mockResolvedValue(ok(undefined));
	(getPubkyDataFromStore as jest.Mock).mockReturnValue(undefined);
});

describe('wipeKeychain', () => {
	it('unpublishes the owned shared records instead of resetting the shared service', async () => {
		const res = await wipeKeychain();

		expect(res.isOk()).toBe(true);
		expect(resetGenericPasswordMock).toHaveBeenCalledWith({ service: PUBKY });
		expect(resetGenericPasswordMock).not.toHaveBeenCalledWith({ service: SHARED_PUBKY_SERVICE });
		expect(unpublishAllOwnedPubkys).toHaveBeenCalled();
	});

	it('keeps the private keychain when the shared records cannot be removed', async () => {
		(unpublishAllOwnedPubkys as jest.Mock).mockResolvedValue(err('delete failed'));

		const res = await wipeKeychain();

		expect(res.isErr()).toBe(true);
		expect(resetGenericPasswordMock).not.toHaveBeenCalled();
	});
});

describe('deletePubky', () => {
	it('resets the keychain entry and unpublishes the shared record', async () => {
		await deletePubky(PUBKY, jest.fn());
		await new Promise(setImmediate);

		expect(resetGenericPasswordMock).toHaveBeenCalledWith({ service: PUBKY });
		expect(unpublishOwnedPubky).toHaveBeenCalledWith(PUBKY);
	});

	it('keeps the pubky when the shared record cannot be removed', async () => {
		(unpublishOwnedPubky as jest.Mock).mockResolvedValue(err('delete failed'));
		const dispatch = jest.fn();

		const res = await deletePubky(PUBKY, dispatch);
		await new Promise(setImmediate);

		expect(res.isErr()).toBe(true);
		expect(dispatch).not.toHaveBeenCalled();
		expect(resetGenericPasswordMock).not.toHaveBeenCalled();
	});

	it('only removes the reference to an adopted pubky', async () => {
		(getPubkyDataFromStore as jest.Mock).mockReturnValue({ sourceApp: 'to.bitkit' });
		const dispatch = jest.fn();

		await deletePubky(EXTERNAL_PUBKY, dispatch);
		await new Promise(setImmediate);

		expect(dispatch).toHaveBeenCalledWith({ type: 'pubky/removePubky', payload: EXTERNAL_PUBKY });
		expect(resetGenericPasswordMock).not.toHaveBeenCalled();
		expect(unpublishOwnedPubky).not.toHaveBeenCalled();
	});
});

describe('pruneMissingExternalPubkys', () => {
	const pubkys: TPubkys = {
		[PUBKY]: defaultPubkyState,
		[EXTERNAL_PUBKY]: { ...defaultPubkyState, sourceApp: 'to.bitkit' },
	};

	it('removes adopted pubkys the owning app no longer publishes', async () => {
		(listExternalPubkys as jest.Mock).mockResolvedValue(ok([]));
		const dispatch = jest.fn();

		await pruneMissingExternalPubkys(pubkys, dispatch);

		expect(dispatch).toHaveBeenCalledTimes(1);
		expect(dispatch).toHaveBeenCalledWith({ type: 'pubky/removePubky', payload: EXTERNAL_PUBKY });
		expect(showToast).toHaveBeenCalledTimes(1);
	});

	it('clears the session secrets of pruned pubkys', async () => {
		const sessionSecret = `pubky-session:${EXTERNAL_PUBKY}:session-id`;
		getAllGenericPasswordServicesMock.mockResolvedValue([PUBKY, sessionSecret]);
		(listExternalPubkys as jest.Mock).mockResolvedValue(ok([]));

		await pruneMissingExternalPubkys(pubkys, jest.fn());

		expect(resetGenericPasswordMock).toHaveBeenCalledWith({ service: sessionSecret });
		expect(resetGenericPasswordMock).not.toHaveBeenCalledWith({ service: PUBKY });
	});

	it('removes adopted pubkys that only another source app publishes', async () => {
		(listExternalPubkys as jest.Mock).mockResolvedValue(
			ok([{ pubky: EXTERNAL_PUBKY, sourceApp: 'to.bitkit.dev' }]),
		);
		const dispatch = jest.fn();

		await pruneMissingExternalPubkys(pubkys, dispatch);

		expect(dispatch).toHaveBeenCalledWith({ type: 'pubky/removePubky', payload: EXTERNAL_PUBKY });
		expect(showToast).toHaveBeenCalledTimes(1);
	});

	it('keeps adopted pubkys that are still published', async () => {
		(listExternalPubkys as jest.Mock).mockResolvedValue(
			ok([{ pubky: EXTERNAL_PUBKY, sourceApp: 'to.bitkit' }]),
		);
		const dispatch = jest.fn();

		await pruneMissingExternalPubkys(pubkys, dispatch);

		expect(dispatch).not.toHaveBeenCalled();
		expect(showToast).not.toHaveBeenCalled();
	});

	it('removes nothing when the shared store cannot be read', async () => {
		(listExternalPubkys as jest.Mock).mockResolvedValue(err('unavailable'));
		const dispatch = jest.fn();

		await pruneMissingExternalPubkys(pubkys, dispatch);

		expect(dispatch).not.toHaveBeenCalled();
		expect(showToast).not.toHaveBeenCalled();
	});
});

describe('adoptExternalPubky', () => {
	it('leaves a pubky Ring already lists untouched', async () => {
		(getPubkyDataFromStore as jest.Mock).mockReturnValue(defaultPubkyState);
		const dispatch = jest.fn();

		await adoptExternalPubky({ pubky: PUBKY, sourceApp: 'to.bitkit', dispatch });

		expect(dispatch).not.toHaveBeenCalled();
	});
});
