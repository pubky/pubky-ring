import { Linking } from 'react-native';
import { openXSuccess } from '../src/utils/xCallback';

jest.mock('react-native', () => ({
	Linking: {
		openURL: jest.fn(),
	},
}));

const openURLMock = Linking.openURL as jest.MockedFunction<typeof Linking.openURL>;

describe('xCallback', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('does not log callback URLs when openURL fails', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		openURLMock.mockRejectedValueOnce(new Error('unregistered scheme'));

		await openXSuccess({ xSuccess: 'bitkit://auth/return?token=not-a-real-secret' });

		expect(warnSpy).toHaveBeenCalledWith('Failed to open x-callback URL');
		expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('not-a-real-secret'));
		warnSpy.mockRestore();
	});
});
