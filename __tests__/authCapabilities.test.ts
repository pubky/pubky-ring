import { buildApprovedCapabilities, hasEncryptionCapabilities } from '../src/utils/authCapabilities.ts';

describe('approved auth capabilities', () => {
	it('removes encryption without removing storage access on the same scope', () => {
		const capabilities = [
			{ path: '/priv/chat/v1/', permission: 'rwe' },
			{ path: '/pub/profile/', permission: 'r' },
		];

		expect(buildApprovedCapabilities(capabilities, false)).toEqual([
			{ path: '/priv/chat/v1/', permission: 'rw' },
			{ path: '/pub/profile/', permission: 'r' },
		]);
	});

	it('omits an encryption-only scope when encryption is declined', () => {
		const capabilities = [{ path: '/priv/chat/keys/', permission: 'e' }];

		expect(buildApprovedCapabilities(capabilities, false)).toEqual([]);
	});

	it('preserves all requested actions when encryption is approved', () => {
		const capabilities = [{ path: '/priv/chat/v1/', permission: 'rwe' }];

		expect(hasEncryptionCapabilities(capabilities)).toBe(true);
		expect(buildApprovedCapabilities(capabilities, true)).toEqual(capabilities);
	});
});
