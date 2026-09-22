import Keychain from 'react-native-keychain';
import { wipeKeychain } from '../src/utils/keychain';
import { deletePubky } from '../src/utils/pubky';
import { unpublishAllOwnedPubkys, unpublishOwnedPubky } from '../src/utils/sharedPubky';
import { SHARED_PUBKY_SERVICE } from '../src/utils/constants';

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
	publishOwnedPubky: jest.fn(async () => undefined),
	unpublishAllOwnedPubkys: jest.fn(async () => undefined),
	unpublishOwnedPubky: jest.fn(async () => undefined),
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

const getAllGenericPasswordServicesMock = Keychain.getAllGenericPasswordServices as jest.Mock;
const resetGenericPasswordMock = Keychain.resetGenericPassword as jest.Mock;

beforeEach(() => {
	jest.clearAllMocks();
	getAllGenericPasswordServicesMock.mockResolvedValue([PUBKY, SHARED_PUBKY_SERVICE]);
	resetGenericPasswordMock.mockResolvedValue(true);
});

describe('wipeKeychain', () => {
	it('unpublishes the owned shared records instead of resetting the shared service', async () => {
		await wipeKeychain();

		expect(resetGenericPasswordMock).toHaveBeenCalledWith({ service: PUBKY });
		expect(resetGenericPasswordMock).not.toHaveBeenCalledWith({ service: SHARED_PUBKY_SERVICE });
		expect(unpublishAllOwnedPubkys).toHaveBeenCalled();
	});
});

describe('deletePubky', () => {
	it('resets the keychain entry and unpublishes the shared record', async () => {
		await deletePubky(PUBKY, jest.fn());
		await new Promise(setImmediate);

		expect(resetGenericPasswordMock).toHaveBeenCalledWith({ service: PUBKY });
		expect(unpublishOwnedPubky).toHaveBeenCalledWith(PUBKY);
	});
});
