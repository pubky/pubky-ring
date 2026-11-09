import Keychain from 'react-native-keychain';
import { resetPubkySessionSecrets } from '../src/utils/keychain';

jest.mock('react-native-keychain', () => ({
	getAllGenericPasswordServices: jest.fn(),
	resetGenericPassword: jest.fn(async () => true),
}));
jest.mock('../src/utils/sharedPubky', () => ({ unpublishAllOwnedPubkys: jest.fn() }));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));

beforeEach(() => jest.clearAllMocks());

it.each([true, false])(
	'clears this pubky’s secrets and preserves only requested cleanup IDs (keep=%s)',
	async keep => {
		(Keychain.getAllGenericPasswordServices as jest.Mock).mockResolvedValue([
			'pubky-session:user:pending',
			'pubky-session:user:revoked',
			'pubky-session:user:orphan',
			'pubky-session:another:pending',
			'identity-secret',
		]);
		const result = await resetPubkySessionSecrets({
			pubky: 'user',
			...(keep ? { keepSessionIds: ['pending'] } : {}),
		});
		expect(result.isOk()).toBe(true);
		expect((Keychain.resetGenericPassword as jest.Mock).mock.calls).toEqual([
			...(!keep ? [[{ service: 'pubky-session:user:pending' }]] : []),
			[{ service: 'pubky-session:user:revoked' }],
			[{ service: 'pubky-session:user:orphan' }],
		]);
	},
);
