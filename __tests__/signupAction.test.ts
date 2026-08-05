import { InputAction } from '../src/utils/inputParser';
import { handleDirectSignupAction, handleSignupAction } from '../src/utils/actions/signupAction';
import { handleAuthAction } from '../src/utils/actions/authAction';
import { hideSheet } from '../src/sheets/sheetNavigation';
import { savePubky, signUpToHomeserver } from '../src/utils/pubky';
import { getSignedUpPubkysFromStore } from '../src/utils/store-helpers';
import { EBackupPreference } from '../src/types/pubky';

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string) => key,
	},
}));

jest.mock('@synonymdev/react-native-pubky', () => ({
	__esModule: true,
	generateMnemonicPhraseAndKeypair: jest.fn(async () => {
		const { ok } = require('@synonymdev/result');
		return ok({
			mnemonic: 'one two three four five six seven eight nine ten eleven twelve',
			secret_key: 'secret-key',
			public_key: 'pubky-created',
		});
	}),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	savePubky: jest.fn(async () => {
		const { ok } = require('@synonymdev/result');
		return ok('pubky-created');
	}),
	signUpToHomeserver: jest.fn(async () => {
		const { ok } = require('@synonymdev/result');
		return ok({ session_secret: 'session-secret' });
	}),
}));

jest.mock('../src/utils/helpers', () => ({
	__esModule: true,
	checkNetworkConnection: jest.fn(async () => true),
}));

jest.mock('../src/utils/xCallback', () => ({
	__esModule: true,
	openXError: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	addProcessing: jest.fn((payload: { pubky: string }) => ({ type: 'pubky/addProcessing', payload })),
	removeProcessing: jest.fn((payload: { pubky: string }) => ({ type: 'pubky/removeProcessing', payload })),
}));

jest.mock('../src/store/slices/uiSlice', () => ({
	__esModule: true,
	setLoadingModalError: jest.fn((payload: unknown) => ({ type: 'ui/setLoadingModalError', payload })),
}));

jest.mock('../src/utils/signupErrors', () => ({
	__esModule: true,
	getSignupTokenErrorModalFields: jest.fn(() => ({})),
}));

jest.mock('../src/utils/store-helpers', () => ({
	__esModule: true,
	getPubkyDataFromStore: jest.fn(),
	getPubkyKeyBySignupTokenFromStore: jest.fn(() => undefined),
	getSignedUpPubkysFromStore: jest.fn(() => ({})),
}));

jest.mock('../src/utils/actions/authAction', () => ({
	__esModule: true,
	handleAuthAction: jest.fn(async () => {
		const { ok } = require('@synonymdev/result');
		return ok('authorized');
	}),
}));

jest.mock('../src/sheets/sheetNavigation', () => ({
	__esModule: true,
	hideSheet: jest.fn(),
}));

const handleAuthActionMock = handleAuthAction as jest.MockedFunction<typeof handleAuthAction>;
const hideSheetMock = hideSheet as jest.MockedFunction<typeof hideSheet>;
const savePubkyMock = savePubky as jest.MockedFunction<typeof savePubky>;
const signUpToHomeserverMock = signUpToHomeserver as jest.MockedFunction<typeof signUpToHomeserver>;
const getSignedUpPubkysFromStoreMock = getSignedUpPubkysFromStore as jest.MockedFunction<
	typeof getSignedUpPubkysFromStore
>;
const homeserverPubkey = '8um71us3fyw6h8wbcxb5ar3rwusy1a6u49956ikzojg3gcwd1dty';

describe('handleSignupAction', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('signs up directly without delivering auth when auth params are absent', async () => {
		const dispatch = jest.fn();
		const setAddPubkyScreen = jest.fn();

		const result = await handleDirectSignupAction(
			{
				action: InputAction.DirectSignup,
				params: {
					homeserver: homeserverPubkey,
					inviteCode: 'ABCD-1234-WXYZ',
				},
			},
			{ dispatch, setAddPubkyScreen },
		);

		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value).toBe('pubky-created');
		}
		expect(setAddPubkyScreen).toHaveBeenCalledWith({ screen: 'Loading' });
		expect(savePubkyMock).toHaveBeenCalledWith(
			expect.objectContaining({
				pubky: 'pubky-created',
				secretKey: 'secret-key',
				signupToken: 'ABCD-1234-WXYZ',
				dispatch,
			}),
		);
		expect(signUpToHomeserverMock).toHaveBeenCalledWith({
			pubky: 'pubky-created',
			secretKey: 'secret-key',
			homeserver: homeserverPubkey,
			signupToken: 'ABCD-1234-WXYZ',
			dispatch,
		});
		expect(hideSheetMock).toHaveBeenCalledWith('add-pubky');
		expect(handleAuthActionMock).not.toHaveBeenCalled();
	});

	it('signs up directly without a signup token when st is absent', async () => {
		const dispatch = jest.fn();
		const setAddPubkyScreen = jest.fn();

		const result = await handleDirectSignupAction(
			{
				action: InputAction.DirectSignup,
				params: {
					homeserver: homeserverPubkey,
					inviteCode: '',
				},
			},
			{ dispatch, setAddPubkyScreen },
		);

		expect(result.isOk()).toBe(true);
		expect(signUpToHomeserverMock).toHaveBeenCalledWith({
			pubky: 'pubky-created',
			secretKey: 'secret-key',
			homeserver: homeserverPubkey,
			signupToken: '',
			dispatch,
		});
		expect(handleAuthActionMock).not.toHaveBeenCalled();
	});

	it('delivers auth after signup when auth params are present', async () => {
		const dispatch = jest.fn();
		const setAddPubkyScreen = jest.fn();
		const xCallback = { xSuccess: 'bitkit://signup/success' };

		const result = await handleSignupAction(
			{
				action: InputAction.Signup,
				params: {
					homeserver: homeserverPubkey,
					inviteCode: 'ABCD-1234-WXYZ',
					relay: 'wss://relay.example.com',
					secret: 'auth-secret',
					caps: ['pubky.app:read', 'pubky.app:write'],
					xCallback,
				},
			},
			{ dispatch, setAddPubkyScreen },
		);

		expect(result.isOk()).toBe(true);
		expect(handleAuthActionMock).toHaveBeenCalledWith(
			{
				action: InputAction.Auth,
				params: {
					relay: 'wss://relay.example.com',
					secret: 'auth-secret',
					caps: ['pubky.app:read', 'pubky.app:write'],
					xCallback,
				},
				rawUrl:
					'pubkyauth:///?relay=wss%3A%2F%2Frelay.example.com&secret=auth-secret&caps=pubky.app%3Aread%2Cpubky.app%3Awrite',
			},
			{ dispatch, setAddPubkyScreen, pubky: 'pubky-created', isDeeplink: false },
		);
	});

	it('keeps the signup error visible for direct signup failures even when existing pubkys are present', async () => {
		const { err } = require('@synonymdev/result');
		const dispatch = jest.fn();
		const setAddPubkyScreen = jest.fn();
		signUpToHomeserverMock.mockResolvedValueOnce(err(new Error('Invite code was already used')));
		getSignedUpPubkysFromStoreMock.mockReturnValueOnce({
			'pubky-existing': {
				name: '',
				image: '',
				homeserver: homeserverPubkey,
				signedUp: true,
				sessions: [],
				signupToken: '',
				backupPreference: EBackupPreference.encryptedFile,
				isBackedUp: false,
			},
		});

		const result = await handleDirectSignupAction(
			{
				action: InputAction.DirectSignup,
				params: {
					homeserver: homeserverPubkey,
					inviteCode: 'ABCD-1234-WXYZ',
				},
			},
			{ dispatch, setAddPubkyScreen },
		);

		expect(result.isErr()).toBe(true);
		expect(hideSheetMock).not.toHaveBeenCalled();
		expect(handleAuthActionMock).not.toHaveBeenCalled();
	});
});
