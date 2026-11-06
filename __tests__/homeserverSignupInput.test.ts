import { parseHomeserverSignupInput } from '../src/utils/homeserverSignupInput';
import { InputAction, parseInput } from '../src/utils/inputParser';
import { PRODUCTION_HOMESERVER } from '../src/utils/constants';

jest.mock('../src/utils/inputParser', () => ({
	InputAction: {
		DirectSignup: 'direct_signup',
		Signup: 'signup',
		Auth: 'auth',
		Invite: 'invite',
		Import: 'import',
		Unknown: 'unknown',
	},
	parseInput: jest.fn(),
}));
const parse = parseInput as jest.MockedFunction<typeof parseInput>;
const parsed = (action: InputAction, params: Record<string, unknown>) =>
	({ action, data: { action, params }, source: 'scan', rawInput: 'input' }) as never;

describe('existing-key signup input', () => {
	it.each(['clipboard', 'scan'] as const)(
		'trims outer whitespace in custom tokens from %s, preserving their contents',
		async source => {
			const homeserver = 'y'.repeat(52);
			const input = ' \tMiX.Case+long/token with spaces\r\n';
			parse.mockResolvedValue(parsed(InputAction.Unknown, { rawData: input }));
			expect(await parseHomeserverSignupInput(input, source, homeserver)).toEqual({
				success: true,
				draft: { homeserver, inviteCode: 'MiX.Case+long/token with spaces' },
			});
		},
	);
	it('loads a direct signup into a normalized draft, preserving a custom token exactly', async () => {
		parse.mockResolvedValue(
			parsed(InputAction.DirectSignup, {
				homeserver: `pubky://${PRODUCTION_HOMESERVER}`,
				inviteCode: 'custom.Mixed+token/longer-than-14',
			}),
		);
		expect(await parseHomeserverSignupInput('link', 'clipboard', '')).toEqual({
			success: true,
			draft: { homeserver: PRODUCTION_HOMESERVER, inviteCode: 'custom.Mixed+token/longer-than-14' },
		});
	});
	it('applies a plain invite to the selected server only', async () => {
		parse.mockResolvedValue(parsed(InputAction.Invite, { inviteCode: 'ABCD-1234-WXYZ' }));
		expect(await parseHomeserverSignupInput('code', 'scan', PRODUCTION_HOMESERVER)).toEqual({
			success: true,
			draft: { homeserver: PRODUCTION_HOMESERVER, inviteCode: 'ABCD-1234-WXYZ' },
		});
		expect(await parseHomeserverSignupInput('code', 'scan', '')).toEqual({
			success: false,
			reason: 'selectServer',
		});
	});
	it.each([InputAction.Signup, InputAction.Auth])(
		'does not discard an authorization request (%s)',
		async action => {
			parse.mockResolvedValue(
				parsed(action, { homeserver: PRODUCTION_HOMESERVER, relay: 'relay', caps: ['/pub/:rw'] }),
			);
			expect(await parseHomeserverSignupInput('link', 'scan', '')).toEqual({
				success: false,
				reason: 'authorization',
			});
		},
	);
	it('rejects invalid server keys and unrelated QR types', async () => {
		parse.mockResolvedValue(parsed(InputAction.DirectSignup, { homeserver: 'invalid', inviteCode: '' }));
		expect(await parseHomeserverSignupInput('link', 'scan', '')).toEqual({
			success: false,
			reason: 'invalid',
		});
		parse.mockResolvedValue(parsed(InputAction.Import, { data: 'recovery phrase' }));
		expect(await parseHomeserverSignupInput('link', 'scan', '')).toEqual({
			success: false,
			reason: 'invalid',
		});
	});
	it('accepts opaque custom tokens without applying Synonym formatting', async () => {
		parse.mockResolvedValue(parsed(InputAction.Unknown, { rawData: 'mixed.Case+long/token' }));
		const homeserver = 'y'.repeat(52);
		expect(await parseHomeserverSignupInput('mixed.Case+long/token', 'clipboard', homeserver)).toEqual({
			success: true,
			draft: { homeserver, inviteCode: 'mixed.Case+long/token' },
		});
		expect(await parseHomeserverSignupInput('https://unrelated.example', 'scan', homeserver)).toEqual({
			success: false,
			reason: 'invalid',
		});
	});
});
