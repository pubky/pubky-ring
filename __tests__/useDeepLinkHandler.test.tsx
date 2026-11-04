import { renderHook, waitFor } from '@testing-library/react-native';
import { useDeepLinkHandler } from '../src/hooks/useDeepLinkHandler';
import { InputAction, type ParsedInput } from '../src/utils/inputParser';
import {
	handleExpectedSignerUnavailable,
	handleNoPubkysAvailable,
	routeInputWithContext,
	showAuthPubkySelection,
} from '../src/utils/inputHandlerUtils';
import { setDeepLink } from '../src/store/slices/pubkysSlice';
import type { Pubky } from '../src/types/pubky';

// React Native's export condition selects Immer's untransformed ESM build in Jest.
jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));

// The selectors and router modules pull native modules in; the hook needs none of them.
jest.mock('../src/utils/pubky.ts', () => ({
	truncateStr: (value: string) => value,
	truncatePubky: (value: string) => `short(${value})`,
}));
jest.mock('@synonymdev/react-native-pubky');
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));
jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ showSheet: jest.fn(), hideSheet: jest.fn() }));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../src/utils/actions/authAction', () => ({ handleAuthAction: jest.fn() }));
jest.mock('../src/utils/actions/importAction', () => ({ handleImportAction: jest.fn() }));
jest.mock('../src/utils/actions/migrateAction', () => ({ handleMigrateAction: jest.fn() }));
jest.mock('../src/utils/actions/signupAction', () => ({
	handleSignupAction: jest.fn(),
	handleDirectSignupAction: jest.fn(),
}));
jest.mock('../src/utils/actions/inviteAction', () => ({ handleInviteAction: jest.fn() }));

jest.mock('../src/utils/inputHandlerUtils', () => ({
	routeInputWithContext: jest.fn(() => Promise.resolve()),
	showAuthPubkySelection: jest.fn(),
	handleNoPubkysAvailable: jest.fn(),
	handleExpectedSignerUnavailable: jest.fn(),
}));

const mockDispatch = jest.fn();
let mockState: { pubky: { pubkys: Record<string, Partial<Pubky>>; deepLink: string } };

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

const USER = '8um71us3fyw6h8wbcxb5ar3rwusy1a6u49956ikzojg3gcwd1dty';
const OTHER = '5jsjx1o6fzu6aeeo697r3i5rx15zq41kikcye8wtwdqm4nb4tryo';
const signedUp = { signedUp: true } as Partial<Pubky>;
const notSetUp = { signedUp: false } as Partial<Pubky>;

const authLink = (expectedSigner?: string): ParsedInput => {
	const rawUrl = 'pubkyauth://signin_grant?caps=/pub/pubky.app/:rw&relay=https://relay.example/inbox&secret=s';
	return {
		action: InputAction.Auth,
		data: {
			action: InputAction.Auth,
			params: {
				kind: 'signin_grant',
				relay: 'https://relay.example/inbox',
				secret: 's',
				caps: ['/pub/pubky.app/:rw'],
				...(expectedSigner ? { expectedSigner } : {}),
			},
			rawUrl,
		},
		source: 'deeplink',
		rawInput: rawUrl,
	};
};

const run = (parsed: ParsedInput, pubkys: Record<string, Partial<Pubky>>): void => {
	mockState = { pubky: { pubkys, deepLink: JSON.stringify(parsed) } };
	renderHook(() => useDeepLinkHandler());
};

describe('useDeepLinkHandler with an expected signer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('opens the named pubky without the picker', async () => {
		const parsed = authLink(USER);
		run(parsed, { [OTHER]: signedUp, [`pk:${USER}`]: signedUp });

		await waitFor(() =>
			expect(routeInputWithContext).toHaveBeenCalledWith(parsed, `pk:${USER}`, 'deeplink', mockDispatch),
		);
		expect(showAuthPubkySelection).not.toHaveBeenCalled();
		expect(handleExpectedSignerUnavailable).not.toHaveBeenCalled();
	});

	it('explains when the named pubky is not in Ring instead of using another', async () => {
		run(authLink(USER), { [OTHER]: signedUp });

		await waitFor(() => expect(handleExpectedSignerUnavailable).toHaveBeenCalledWith(`short(${USER})`, false));
		expect(mockDispatch).toHaveBeenCalledWith(setDeepLink(''));
		expect(routeInputWithContext).not.toHaveBeenCalled();
		expect(showAuthPubkySelection).not.toHaveBeenCalled();
	});

	it('explains when the named pubky is in Ring but not set up', async () => {
		run(authLink(USER), { [OTHER]: signedUp, [USER]: notSetUp });

		await waitFor(() => expect(handleExpectedSignerUnavailable).toHaveBeenCalledWith(`short(${USER})`, true));
		expect(routeInputWithContext).not.toHaveBeenCalled();
		expect(handleNoPubkysAvailable).not.toHaveBeenCalled();
	});
});

describe('useDeepLinkHandler without an expected signer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows the picker for several pubkys, as before', async () => {
		const parsed = authLink();
		run(parsed, { [OTHER]: signedUp, [USER]: signedUp });

		await waitFor(() => expect(showAuthPubkySelection).toHaveBeenCalledWith(parsed, 'deeplink'));
		expect(routeInputWithContext).not.toHaveBeenCalled();
	});

	it('uses the only pubky, as before', async () => {
		const parsed = authLink();
		run(parsed, { [OTHER]: signedUp });

		await waitFor(() =>
			expect(routeInputWithContext).toHaveBeenCalledWith(parsed, OTHER, 'deeplink', mockDispatch),
		);
		expect(showAuthPubkySelection).not.toHaveBeenCalled();
	});
});
