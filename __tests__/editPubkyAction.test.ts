import { submitEditPubky } from '../src/utils/actions/editPubkyAction';
import { EBackupPreference, Pubky } from '../src/types/pubky';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver } from '../src/utils/pubky';
import { setPubkyData } from '../src/store/slices/pubkysSlice';

jest.mock('../src/utils/pubky', () => ({
	__esModule: true,
	getPubkySecretKey: jest.fn(),
	signInToHomeserver: jest.fn(),
	signUpToHomeserver: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice', () => ({
	__esModule: true,
	setPubkyData: jest.fn(payload => ({ type: 'pubky/setPubkyData', payload })),
}));

const getPubkySecretKeyMock = getPubkySecretKey as jest.MockedFunction<typeof getPubkySecretKey>;
const signUpToHomeserverMock = signUpToHomeserver as jest.MockedFunction<typeof signUpToHomeserver>;
const signInToHomeserverMock = signInToHomeserver as jest.MockedFunction<typeof signInToHomeserver>;
const setPubkyDataMock = setPubkyData as jest.MockedFunction<typeof setPubkyData>;

const okResult = <T,>(value: T) => ({
	isErr: () => false,
	value,
});

const errResult = (message: string) => ({
	isErr: () => true,
	error: { message },
});

const pubkyData = (overrides: Partial<Pubky> = {}): Pubky => ({
	name: 'Old name',
	homeserver: 'pk:server',
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
	});

	it('saves only metadata when already signed up to the selected homeserver', async () => {
		const dispatch = jest.fn();

		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData(),
			name: 'New name',
			homeserver: 'pk:server',
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
				homeserver: 'pk:server',
			},
		});
	});

	it('returns token signup errors without falling back to signin', async () => {
		const dispatch = jest.fn();
		getPubkySecretKeyMock.mockResolvedValue(okResult({ secretKey: 'secret-key' }) as never);
		signUpToHomeserverMock.mockResolvedValue(errResult('Token required') as never);

		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData({ homeserver: 'pk:old-server' }),
			name: 'New name',
			homeserver: 'pk:new-server',
			signupToken: 'ABCD-1234-WXYZ',
			dispatch,
		});

		expect(result).toEqual({ success: false, type: 'signup', message: 'Token required' });
		expect(signInToHomeserverMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).toHaveBeenCalledWith({
			pubky: 'pubky',
			data: { name: 'New name' },
		});
	});

	it('clears homeserver signup state when removing the homeserver from the pubky', async () => {
		const dispatch = jest.fn();

		const result = await submitEditPubky({
			pubky: 'pubky',
			storedPubkyData: pubkyData(),
			name: 'New name',
			homeserver: '',
			signupToken: '',
			dispatch,
		});

		expect(result).toEqual({ success: true });
		expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
		expect(setPubkyDataMock).toHaveBeenCalledWith({
			pubky: 'pubky',
			data: {
				name: 'New name',
				homeserver: '',
				signedUp: false,
				signupToken: '',
			},
		});
	});
});
