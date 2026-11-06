import { PRODUCTION_HOMESERVER, STAGING_HOMESERVER } from '../src/utils/constants';
import { submitEditPubky } from '../src/utils/actions/editPubkyAction';
import { EBackupPreference, Pubky } from '../src/types/pubky';
import {
	getPubkySecretKey,
	signInToHomeserver,
	signUpToHomeserver,
	signOutRingFromHomeserver,
} from '../src/utils/pubky';
import { setPubkyData } from '../src/store/slices/pubkysSlice';
import { err } from '@synonymdev/result';
import { HomeserverChangedError } from '../src/utils/homeserverChangedError';

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	getPubkySecretKey: jest.fn(),
	signInToHomeserver: jest.fn(),
	signUpToHomeserver: jest.fn(),
	signOutRingFromHomeserver: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	setPubkyData: jest.fn(payload => ({ type: 'pubky/setPubkyData', payload })),
}));

const signOutMock = signOutRingFromHomeserver as jest.MockedFunction<typeof signOutRingFromHomeserver>;
const getPubkySecretKeyMock = getPubkySecretKey as jest.MockedFunction<typeof getPubkySecretKey>;
const signUpToHomeserverMock = signUpToHomeserver as jest.MockedFunction<typeof signUpToHomeserver>;
const signInToHomeserverMock = signInToHomeserver as jest.MockedFunction<typeof signInToHomeserver>;
const setPubkyDataMock = setPubkyData as jest.MockedFunction<typeof setPubkyData>;

const okResult = <T>(value: T) => ({
	isErr: () => false,
	value,
});

const errResult = (message: string) => ({
	isErr: () => true,
	error: { message },
});

const pubkyData = (overrides: Partial<Pubky> = {}): Pubky => ({
	name: 'Old name',
	homeserver: PRODUCTION_HOMESERVER,
	signupToken: 'OLD-TOKEN',
	signedUp: true,
	image: '',
	sessions: [],
	backupPreference: EBackupPreference.encryptedFile,
	isBackedUp: false,
	...overrides,
});

describe('submitEditPubky', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signOutMock.mockResolvedValue(okResult(undefined) as never);
	});

	it('saves only metadata when already signed up to the selected homeserver', async () => {
		const dispatch = jest.fn();

		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData(),
			name: 'New name',
			homeserver: PRODUCTION_HOMESERVER,
			signupToken: 'ABCD-1234-WXYZ',
			dispatch,
		});

		expect(result).toEqual({ success: true });
		expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
		expect(signUpToHomeserverMock).not.toHaveBeenCalled();
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).toHaveBeenCalledWith({
			pubky: 'pubky',
			data: {
				name: 'New name',
				homeserver: PRODUCTION_HOMESERVER,
				signupToken: '',
			},
		});
	});

	it.each([true, false])('only renames an adopted pubky (signedUp=%s)', async signedUp => {
		const dispatch = jest.fn();

		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ sourceApp: 'to.bitkit', signedUp }),
			name: 'New name',
			homeserver: 'pk:different-server',
			signupToken: '',
			dispatch,
		});

		expect(result).toEqual({ success: true });
		expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
		expect(signUpToHomeserverMock).not.toHaveBeenCalled();
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).toHaveBeenCalledWith({ pubky: 'pubky', data: { name: 'New name' } });
	});

	it('returns token signup errors without falling back to signin', async () => {
		const dispatch = jest.fn();
		getPubkySecretKeyMock.mockResolvedValue(okResult({ secretKey: 'secret-key' }) as never);
		signUpToHomeserverMock.mockResolvedValue(errResult('Token required') as never);

		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ homeserver: PRODUCTION_HOMESERVER }),
			name: 'New name',
			homeserver: STAGING_HOMESERVER,
			signupToken: 'ABCD-1234-WXYZ',
			dispatch,
		});

		expect(result).toEqual({ success: false, type: 'signup', message: 'Token required' });
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).not.toHaveBeenCalled();
	});

	it('never signs out or clears a configured server through Save', async () => {
		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData(),
			name: 'New name',
			homeserver: '',
			signupToken: '',
			dispatch: jest.fn(),
		});
		expect(result).toEqual({ success: false, type: 'signup' });
		expect(signOutMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).not.toHaveBeenCalled();
	});
	it('only clears a draft server for an unconfigured key', async () => {
		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ signedUp: false, homeserver: '' }),
			name: 'Offline key',
			homeserver: '',
			signupToken: '',
			dispatch: jest.fn(),
		});
		expect(result).toEqual({ success: true });
		expect(signOutMock).not.toHaveBeenCalled();
		expect(signUpToHomeserverMock).not.toHaveBeenCalled();
	});
	it('uses the signup session without another signin and does not persist the invite', async () => {
		getPubkySecretKeyMock.mockResolvedValue(okResult({ secretKey: 'secret-key' }) as never);
		signUpToHomeserverMock.mockResolvedValue(okResult({}) as never);
		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData(),
			name: 'New name',
			homeserver: STAGING_HOMESERVER,
			signupToken: 'CODE',
			dispatch: jest.fn(),
		});
		expect(result).toEqual({ success: true });
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).toHaveBeenCalledWith({
			pubky: 'pubky',
			data: { name: 'New name', homeserver: STAGING_HOMESERVER, signupToken: '' },
		});
	});
	it('signs in an existing account without attempting signup or requiring an invite', async () => {
		getPubkySecretKeyMock.mockResolvedValue(okResult({ secretKey: 'secret-key' }) as never);
		signInToHomeserverMock.mockResolvedValue(okResult({}) as never);
		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ signedUp: false }),
			name: 'Imported',
			homeserver: PRODUCTION_HOMESERVER,
			linkedHomeserver: PRODUCTION_HOMESERVER,
			signupToken: '',
			dispatch: jest.fn(),
		});
		expect(result).toEqual({ success: true });
		expect(signInToHomeserverMock).toHaveBeenCalledTimes(1);
		expect(signInToHomeserverMock).toHaveBeenCalledWith(expect.objectContaining({ allowRepublish: false }));
		expect(signUpToHomeserverMock).not.toHaveBeenCalled();
	});
	it('keeps sign-in errors retryable without falling back to signup', async () => {
		getPubkySecretKeyMock.mockResolvedValue(okResult({ secretKey: 'secret-key' }) as never);
		signInToHomeserverMock.mockResolvedValue(errResult('Offline') as never);
		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ signedUp: false }),
			name: 'Draft',
			homeserver: PRODUCTION_HOMESERVER,
			linkedHomeserver: PRODUCTION_HOMESERVER,
			signupToken: '',
			dispatch: jest.fn(),
		});
		expect(result).toEqual({ success: false, type: 'signin', message: 'Offline' });
		expect(signUpToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).not.toHaveBeenCalled();
	});
	it('passes the actual server to the form after a sign-in mismatch without signing up', async () => {
		getPubkySecretKeyMock.mockResolvedValue(okResult({ secretKey: 'secret-key' }) as never);
		signInToHomeserverMock.mockResolvedValue(err(new HomeserverChangedError(STAGING_HOMESERVER, 'Changed')));
		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ signedUp: false }),
			name: 'Draft',
			homeserver: PRODUCTION_HOMESERVER,
			linkedHomeserver: PRODUCTION_HOMESERVER,
			signupToken: '',
			dispatch: jest.fn(),
		});
		expect(result).toEqual({ success: false, type: 'homeserverChanged', homeserver: STAGING_HOMESERVER });
		expect(signUpToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).not.toHaveBeenCalled();
	});
});
