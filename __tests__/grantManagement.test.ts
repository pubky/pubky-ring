import { ok } from '@synonymdev/result';
import * as ReactNativePubky from '@synonymdev/react-native-pubky';
import { getSessionSecret } from '../src/utils/keychain.ts';
import { getPubkyDataFromStore } from '../src/utils/store-helpers.ts';
import { listAuthorizedGrants, revokeAuthorizedGrant } from '../src/utils/pubky.ts';

jest.mock('@synonymdev/react-native-pubky', () => ({
	...jest.requireActual('@synonymdev/react-native-pubky'),
	listGrants: jest.fn(),
	revokeGrant: jest.fn(),
	revalidateSession: jest.fn(),
}));

jest.mock('uuid', () => ({
	__esModule: true,
	v5: jest.fn(() => 'new-root-session'),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('../src/utils/keychain.ts', () => ({
	getSessionSecret: jest.fn(),
}));

jest.mock('../src/utils/store-helpers.ts', () => ({
	getPubkyDataFromStore: jest.fn(),
}));

jest.mock('../src/utils/helpers.ts', () => ({
	checkNetworkConnection: jest.fn(async () => true),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	showToast: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice.ts', () => ({
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

const getSessionSecretMock = getSessionSecret as jest.MockedFunction<typeof getSessionSecret>;
const getPubkyDataFromStoreMock = getPubkyDataFromStore as jest.MockedFunction<typeof getPubkyDataFromStore>;
const {
	listGrants: mockListGrants,
	revokeGrant: mockRevokeGrant,
	revalidateSession: mockRevalidateSession,
} = ReactNativePubky as unknown as {
	listGrants: jest.Mock;
	revokeGrant: jest.Mock;
	revalidateSession: jest.Mock;
};

const thirdPartyGrant = {
	grant_id: 'third-party-grant',
	client_id: 'example.app',
	capabilities: '/pub/example.app/:rw',
	issued_at: 1_700_000_000,
	expires_at: 1_800_000_000,
};

describe('grant management', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		getPubkyDataFromStoreMock.mockReturnValue({
			sessions: [{ id: 'root-session', capabilities: ['/:rw'], created_at: 1 }],
		} as ReturnType<typeof getPubkyDataFromStore>);
		getSessionSecretMock.mockResolvedValue(ok('root-grant-secret'));
		mockRevalidateSession.mockResolvedValue(ok({ grant_id: 'current-ring-grant' }));
	});

	it('lists other grants, including Ring grants from other sessions, without exposing the current grant', async () => {
		mockListGrants.mockResolvedValue(
			ok([
				thirdPartyGrant,
				{ ...thirdPartyGrant, grant_id: 'current-ring-grant', client_id: 'app.pubkyring' },
				{ ...thirdPartyGrant, grant_id: 'other-ring-grant', client_id: 'app.pubkyring' },
			]),
		);

		const result = await listAuthorizedGrants({ pubky: 'user-pubky', dispatch: jest.fn() });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				grants: [
					thirdPartyGrant,
					{ ...thirdPartyGrant, grant_id: 'other-ring-grant', client_id: 'app.pubkyring' },
				],
				sessionId: 'root-session',
			});
		}
		expect(mockListGrants).toHaveBeenCalledWith('root-grant-secret');
		expect(mockRevalidateSession).toHaveBeenCalledWith('root-grant-secret');
	});

	it('protects every Ring grant when current grant metadata is unavailable', async () => {
		mockRevalidateSession.mockResolvedValue(ok({}));
		mockListGrants.mockResolvedValue(
			ok([thirdPartyGrant, { ...thirdPartyGrant, grant_id: 'ring-grant', client_id: 'app.pubkyring' }]),
		);

		const result = await listAuthorizedGrants({ pubky: 'user-pubky', dispatch: jest.fn() });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.grants).toEqual([thirdPartyGrant]);
		}
	});

	it('revokes a grant with the selected management session', async () => {
		mockRevokeGrant.mockResolvedValue(ok('Grant revoked'));

		const result = await revokeAuthorizedGrant({
			pubky: 'user-pubky',
			sessionId: 'root-session',
			grantId: thirdPartyGrant.grant_id,
		});

		expect(result.isOk()).toBe(true);
		expect(mockRevokeGrant).toHaveBeenCalledWith('root-grant-secret', thirdPartyGrant.grant_id);
	});
});
