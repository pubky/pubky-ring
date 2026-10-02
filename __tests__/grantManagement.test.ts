import { err, ok } from '@synonymdev/result';
import * as ReactNativePubky from '@synonymdev/react-native-pubky';
import { getSessionSecret, resetSessionSecret, setSessionSecret } from '../src/utils/keychain.ts';
import { getPubkyDataFromStore } from '../src/utils/store-helpers.ts';
import { listAuthorizedGrants, revokeAuthorizedGrant } from '../src/utils/pubky.ts';

jest.mock('@synonymdev/react-native-pubky', () => ({
	...jest.requireActual('@synonymdev/react-native-pubky'),
	listGrants: jest.fn(),
	revokeGrant: jest.fn(),
	revalidateSession: jest.fn(),
	signIn: jest.fn(),
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
	getKeychainValue: jest.fn(async () => {
		const { ok: resultOk } = require('@synonymdev/result');
		return resultOk(JSON.stringify({ secretKey: 'identity-secret', mnemonic: '' }));
	}),
	getSessionSecret: jest.fn(),
	resetSessionSecret: jest.fn(),
	setSessionSecret: jest.fn(),
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
const resetSessionSecretMock = resetSessionSecret as jest.MockedFunction<typeof resetSessionSecret>;
const setSessionSecretMock = setSessionSecret as jest.MockedFunction<typeof setSessionSecret>;
const getPubkyDataFromStoreMock = getPubkyDataFromStore as jest.MockedFunction<typeof getPubkyDataFromStore>;
const {
	listGrants: mockListGrants,
	revokeGrant: mockRevokeGrant,
	revalidateSession: mockRevalidateSession,
	signIn: mockSignIn,
} = ReactNativePubky as unknown as {
	listGrants: jest.Mock;
	revokeGrant: jest.Mock;
	revalidateSession: jest.Mock;
	signIn: jest.Mock;
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
			sessions: [
				{ id: 'root-session', grant_id: 'current-ring-grant', capabilities: ['/:rw'], created_at: 1 },
			],
		} as ReturnType<typeof getPubkyDataFromStore>);
		getSessionSecretMock.mockResolvedValue(ok('root-grant-secret'));
		resetSessionSecretMock.mockResolvedValue(ok(true));
		setSessionSecretMock.mockResolvedValue(ok('replacement-grant-secret'));
		mockRevalidateSession.mockResolvedValue(ok({ grant_id: 'current-ring-grant' }));
	});

	it('excludes every grant backed by a local Ring session', async () => {
		getPubkyDataFromStoreMock.mockReturnValue({
			sessions: [
				{ id: 'root-session', grant_id: 'current-ring-grant', capabilities: ['/:rw'], created_at: 1 },
				{ id: 'old-session', grant_id: 'old-local-ring-grant', capabilities: ['/:rw'], created_at: 2 },
			],
		} as ReturnType<typeof getPubkyDataFromStore>);
		mockListGrants.mockResolvedValue(
			ok([
				thirdPartyGrant,
				{ ...thirdPartyGrant, grant_id: 'current-ring-grant', client_id: 'app.pubkyring' },
				{ ...thirdPartyGrant, grant_id: 'old-local-ring-grant', client_id: 'app.pubkyring' },
				{ ...thirdPartyGrant, grant_id: 'other-device-ring-grant', client_id: 'app.pubkyring' },
			]),
		);

		const result = await listAuthorizedGrants({ pubky: 'user-pubky', dispatch: jest.fn() });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				grants: [
					thirdPartyGrant,
					{ ...thirdPartyGrant, grant_id: 'other-device-ring-grant', client_id: 'app.pubkyring' },
				],
				sessionId: 'root-session',
			});
		}
		expect(mockListGrants).toHaveBeenCalledWith('root-grant-secret');
		expect(mockRevalidateSession).not.toHaveBeenCalled();
	});

	it('does not create a replacement Ring grant when a stored session cannot list grants', async () => {
		mockListGrants.mockResolvedValue(err('Offline'));
		const dispatch = jest.fn();

		const result = await listAuthorizedGrants({ pubky: 'user-pubky', dispatch });

		expect(result.isErr()).toBe(true);
		expect(mockRevalidateSession).toHaveBeenCalledWith('root-grant-secret');
		expect(resetSessionSecretMock).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/removeSession' }));
		expect(mockSignIn).not.toHaveBeenCalled();
	});

	it('preserves stored session metadata when Keychain access fails', async () => {
		getSessionSecretMock.mockResolvedValueOnce(err('Keychain unavailable'));
		const dispatch = jest.fn();

		const result = await listAuthorizedGrants({ pubky: 'user-pubky', dispatch });

		expect(result.isErr()).toBe(true);
		expect(resetSessionSecretMock).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'pubky/removeSession' }));
		expect(mockSignIn).not.toHaveBeenCalled();
	});

	it('replaces a stored management session after confirming it was revoked', async () => {
		mockListGrants
			.mockResolvedValueOnce(err('Failed to list grants: unauthorized'))
			.mockResolvedValueOnce(
				ok([
					thirdPartyGrant,
					{ ...thirdPartyGrant, grant_id: 'replacement-ring-grant', client_id: 'app.pubkyring' },
				]),
			);
		mockRevalidateSession.mockResolvedValueOnce(err('Session is no longer valid (expired or invalidated)'));
		mockSignIn.mockResolvedValueOnce(
			ok({
				grant_secret: 'replacement-grant-secret',
				grant_id: 'replacement-ring-grant',
				capabilities: ['/:rw'],
			}),
		);
		const dispatch = jest.fn();

		const result = await listAuthorizedGrants({ pubky: 'user-pubky', dispatch });

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toEqual({
				grants: [thirdPartyGrant],
				sessionId: 'new-root-session',
			});
		}
		expect(resetSessionSecretMock).toHaveBeenCalledWith({
			pubky: 'user-pubky',
			sessionId: 'root-session',
		});
		expect(dispatch).toHaveBeenCalledWith({
			type: 'pubky/removeSession',
			payload: { pubky: 'user-pubky', sessionId: 'root-session' },
		});
		expect(mockSignIn).toHaveBeenCalled();
		expect(setSessionSecretMock).toHaveBeenCalledWith({
			pubky: 'user-pubky',
			sessionId: 'new-root-session',
			sessionSecret: 'replacement-grant-secret',
		});
	});

	it('does not create a management grant for an adopted pubky', async () => {
		getPubkyDataFromStoreMock.mockReturnValue({
			sourceApp: 'bitkit',
			sessions: [],
		} as unknown as ReturnType<typeof getPubkyDataFromStore>);

		const result = await listAuthorizedGrants({ pubky: 'adopted-pubky', dispatch: jest.fn() });

		expect(result.isErr()).toBe(true);
		expect(mockSignIn).not.toHaveBeenCalled();
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
