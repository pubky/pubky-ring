import { Linking } from 'react-native';
import {
	hasValidSessionCallbacks,
	isValidSessionCallbackUrl,
	openXSuccessWithParams,
} from '../src/utils/xCallback';

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

	it('accepts any callback URL with an explicit scheme', () => {
		expect(isValidSessionCallbackUrl('bitkit://session/return')).toBe(true);
		expect(isValidSessionCallbackUrl('https://webhook.site/session')).toBe(true);
		expect(isValidSessionCallbackUrl('http://webhook.site/session')).toBe(true);
		expect(isValidSessionCallbackUrl('unknown://session/return')).toBe(true);
		expect(isValidSessionCallbackUrl('webhook.site/session')).toBe(false);
	});

	it('requires every provided session callback URL to include a scheme', () => {
		expect(
			hasValidSessionCallbacks({
				xSuccess: 'bitkit://session/return',
				xError: 'https://webhook.site/error',
				xCancel: 'unknown://session/cancel',
			}),
		).toBe(true);

		expect(
			hasValidSessionCallbacks({
				xSuccess: 'bitkit://session/return',
				xError: 'webhook.site/error',
			}),
		).toBe(false);
	});

	it('does not log callback URLs containing session secrets when openURL fails', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		openURLMock.mockRejectedValueOnce(new Error('unregistered scheme'));

		await openXSuccessWithParams(
			{ xSuccess: 'bitkit://session/return' },
			{ session_secret: 'pubky:secret-cookie' },
		);

		expect(warnSpy).toHaveBeenCalledWith('Failed to open x-callback URL:', expect.any(Error));
		expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('pubky:secret-cookie'));
		warnSpy.mockRestore();
	});
});
