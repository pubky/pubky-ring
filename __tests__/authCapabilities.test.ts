import { buildApprovedCapabilities, hasEncryptionCapabilities } from '../src/utils/authCapabilities.ts';

describe('selective auth capabilities', () => {
	it('removes encryption without removing storage access on the same scope', () => {
		const capabilities = [
			{ path: '/priv/chat/v1/', permission: 'rwe' },
			{ path: '/pub/profile/', permission: 'r' },
		];

		expect(buildApprovedCapabilities(capabilities, new Set([0]))).toBe('/priv/chat/v1/:rw,/pub/profile/:r');
	});

	it('omits an encryption-only scope when encryption is declined', () => {
		const capabilities = [{ path: '/priv/chat/keys/', permission: 'e' }];

		expect(buildApprovedCapabilities(capabilities, new Set([0]))).toBe('');
	});

	it('preserves all requested actions by default', () => {
		const capabilities = [{ path: '/priv/chat/v1/', permission: 'rwe' }];

		expect(hasEncryptionCapabilities(capabilities)).toBe(true);
		expect(buildApprovedCapabilities(capabilities, new Set())).toBe('/priv/chat/v1/:rwe');
	});
});
