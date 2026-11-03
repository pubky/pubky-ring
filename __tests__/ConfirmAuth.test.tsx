import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react-native';
import { err, ok } from '@synonymdev/result';
import { auth, authWithCapabilities, republishHomeserver, signIn } from '@synonymdev/react-native-pubky';
import type { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import ConfirmAuth from '../src/screens/ConfirmAuth';
import { getKeychainValue, setSessionSecret } from '../src/utils/keychain';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';
import { syncAuthorizedGrantsAfterAuth } from '../src/utils/authorizedGrants';
import { openXCancel, openXSuccess, openXError } from '../src/utils/xCallback';
import { hideSheet } from '../src/sheets/sheetNavigation';
import { defaultPubkyState } from '../src/store/shapes/pubky';
import type { AuthCapability } from '../src/utils/authCapabilities';

const mockDispatch = jest.fn();
let mockAlwaysShowDetails = false;
let mockDismissSheet: (() => void) | undefined;

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));

jest.mock('@synonymdev/react-native-pubky', () => ({
	...jest.requireActual('@synonymdev/react-native-pubky'),
	auth: jest.fn(),
	authWithCapabilities: jest.fn(),
	signIn: jest.fn(),
	republishHomeserver: jest.fn(),
}));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));

jest.mock('react-redux', () => ({
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: unknown) => unknown) =>
		selector({ settings: { alwaysShowAuthDetails: mockAlwaysShowDetails } }),
}));

jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({
	getPubkyName: () => 'Test Pubky',
}));
jest.mock('../src/store/selectors/authorizedGrantsSelectors.ts', () => ({
	getAuthorizedGrantCount: () => 0,
}));
jest.mock('../src/store/slices/pubkysSlice', () => ({
	addSession: (payload: unknown) => ({ type: 'pubky/addSession', payload }),
	setSignedUp: (payload: unknown) => ({ type: 'pubky/setSignedUp', payload }),
	setHomeserver: (payload: unknown) => ({ type: 'pubky/setHomeserver', payload }),
}));
jest.mock('../src/utils/keychain', () => ({
	getKeychainValue: jest.fn(),
	setSessionSecret: jest.fn(),
}));
jest.mock('../src/utils/store-helpers', () => ({ getPubkyDataFromStore: jest.fn() }));
jest.mock('../src/utils/authorizedGrants.ts', () => ({ syncAuthorizedGrantsAfterAuth: jest.fn() }));
jest.mock('../src/utils/helpers.ts', () => ({
	checkNetworkConnection: jest.fn(async () => true),
	sleep: jest.fn(async () => undefined),
}));
jest.mock('../src/utils/xCallback.ts', () => ({
	openXSuccess: jest.fn(),
	openXError: jest.fn(),
	openXCancel: jest.fn(),
}));
jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ hideSheet: jest.fn() }));
jest.mock('uuid', () => ({ v5: () => 'replacement-session' }));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key },
}));
jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('styled-components/native', () => ({
	useTheme: () => ({
		colors: { input: '#333333', pubkyApp: '#ccff00', primaryForeground: '#000000', primary: '#ffffff' },
	}),
}));
jest.mock('react-native-reanimated', () => ({
	__esModule: true,
	default: { View: require('react-native').View },
	useSharedValue: (initialValue: number) =>
		require('react').useState(() => ({
			value: initialValue,
			get() {
				return this.value;
			},
			set(value: number) {
				this.value = value;
			},
		}))[0],
	useAnimatedStyle: () => ({}),
	withTiming: (value: number) => value,
	withSequence: (...values: number[]) => values.at(-1),
}));

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { View, Text } = require('react-native');
	return {
		SheetScreen: ({
			children,
			title,
			headerRight,
			showBackButton,
			onBackPress,
		}: {
			children: React.ReactNode;
			title: string;
			headerRight?: React.ReactNode;
			showBackButton?: boolean;
			onBackPress?: () => void;
		}) =>
			ReactMock.createElement(
				View,
				null,
				ReactMock.createElement(Text, null, title),
				headerRight,
				showBackButton &&
					ReactMock.createElement(require('react-native').Pressable, {
						testID: 'auth-back-button',
						onPress: onBackPress,
					}),
				children,
			),
	};
});
jest.mock('../src/components/Button.tsx', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');
	return {
		__esModule: true,
		default: ({ text, ...props }: { text: string }) =>
			ReactMock.createElement(Pressable, props, ReactMock.createElement(Text, null, text)),
	};
});
jest.mock('../src/components/PermissionCard.tsx', () => ({
	__esModule: true,
	default: require('react-native').View,
}));
jest.mock('../src/components/AuthIdentity.tsx', () => ({
	__esModule: true,
	default: () =>
		require('react').createElement(require('react-native').View, { testID: 'mock-auth-identity' }),
}));
jest.mock('../src/components/SafeAreaInset.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/CircularProgressBar.tsx', () => ({
	__esModule: true,
	default: () =>
		require('react').createElement(require('react-native').View, { testID: 'AuthHeaderProgress' }),
}));
jest.mock('../src/theme/typography', () => {
	const { Text } = require('react-native');
	return { TextSmM: Text, TextXsM: Text };
});
jest.mock('../src/icons/index.ts', () => ({
	CheckCircle: () => null,
	Folder: () => null,
	Key: () => null,
	UserCheck: () => null,
	Eye: () => null,
	Pencil: () => null,
	Lock: () => null,
	Globe: () => null,
	List: () => null,
}));

jest.mock('../src/components/AuthSummary.tsx', () => ({
	__esModule: true,
	default: (props: unknown) =>
		require('react').createElement(require('react-native').View, {
			...(props as object),
			testID: 'mock-auth-summary',
		}),
}));
jest.mock('../src/components/SwipeToConfirm.tsx', () => ({
	__esModule: true,
	default: ({ onConfirm, loading, ...props }: { onConfirm: () => Promise<void>; loading: boolean }) =>
		require('react').createElement(require('react-native').Pressable, {
			...props,
			disabled: loading,
			onPress: onConfirm,
		}),
}));

const renderRequest = (
	capabilities: AuthCapability[],
	xCallback?: { xSuccess?: string; xCancel?: string },
): string => {
	const caps = capabilities.map(({ path, permission }) => `${path}:${permission}`).join(',');
	const authUrl = `pubkyauth://signin_grant?caps=${encodeURIComponent(caps)}&relay=https%3A%2F%2Frelay.example.com%2Finbox&cid=example.app&cpk=client-pubky&af=v1&epk=ephemeral-key`;
	const authDetails: PubkyAuthDetails = {
		kind: 'signin_grant',
		client_id: 'example.app',
		relay: 'https://relay.example.com/inbox',
		approval_format: 'signed_approval_v1',
		ephemeral_public_key: 'ephemeral-key',
		capabilities,
	};
	render(
		<ConfirmAuth
			route={{ params: { pubky: 'test-pubky', authUrl, authDetails, xCallback } } as never}
			navigation={
				{
					getParent: () => ({
						addListener: (_event: string, listener: () => void) => {
							mockDismissSheet = listener;
							return jest.fn();
						},
					}),
				} as never
			}
		/>,
	);
	return authUrl;
};

const approve = async (): Promise<void> => {
	await act(async () => {
		fireEvent.press(screen.getByTestId('ConfirmAuthAuthorizeButton'));
	});
};

describe('ConfirmAuth v14 integration', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		mockAlwaysShowDetails = false;
		jest.spyOn(console, 'log').mockImplementation(() => undefined);
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		jest.mocked(auth).mockReset().mockResolvedValue(ok([]));
		jest.mocked(authWithCapabilities).mockReset().mockResolvedValue(ok('success'));
		jest
			.mocked(getKeychainValue)
			.mockResolvedValue(ok(JSON.stringify({ secretKey: 'identity-secret', mnemonic: '' })));
		jest.mocked(getPubkyDataFromStore).mockReturnValue({
			...defaultPubkyState,
			signedUp: true,
			homeserver: 'homeserver.example',
		});
		jest.mocked(republishHomeserver).mockResolvedValue(ok('success'));
		jest.mocked(signIn).mockResolvedValue(
			ok({
				homeserver: 'homeserver.example',
				pubky: 'test-pubky',
				client_id: 'app.pubkyring',
				grant_secret: 'management-secret',
				grant_id: 'management-grant',
				capabilities: ['/:rw'],
				token_expires_at: 1_800_000_000,
				grant_expires_at: 1_800_000_000,
				created_at: 1_700_000_000,
			}),
		);
		jest.mocked(setSessionSecret).mockResolvedValue(ok('management-secret'));
		jest.mocked(syncAuthorizedGrantsAfterAuth).mockResolvedValue(undefined);
	});

	afterEach(() => {
		cleanup();
		jest.clearAllTimers();
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it.each(['ios', 'android'] as const)('keeps header progress until authorized on %s', async platform => {
		jest.replaceProperty(Platform, 'OS', platform);
		renderRequest([]);
		expect(screen.getByTestId('AuthHeaderProgress')).toBeTruthy();
		await approve();
		expect(screen.queryByTestId('AuthHeaderProgress')).toBeNull();
		expect(screen.getByText('auth.authorizedTitle')).toBeTruthy();
	});

	it('starts with basics by default, and opens details without changing the saved preference', () => {
		renderRequest([{ path: '/pub/pubky.app/', permission: 'rw' }]);
		expect(screen.getByTestId('ConfirmAuthShowDetailsButton')).toBeVisible();
		expect(screen.queryByText('/pub/pubky.app/')).toBeNull();
		fireEvent.press(screen.getByTestId('ConfirmAuthShowDetailsButton'));
		expect(screen.getByText('/pub/pubky.app/')).toBeTruthy();
		expect(screen.getByText('https://relay.example.com/inbox')).toBeTruthy();
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it('opens details immediately when the preference is enabled', () => {
		mockAlwaysShowDetails = true;
		renderRequest([{ path: '/pub/pubky.app/', permission: 'rw' }]);
		expect(screen.getByText('/pub/pubky.app/')).toBeTruthy();
		expect(screen.queryByTestId('ConfirmAuthShowDetailsButton')).toBeNull();
	});

	it.each([5, 12])('keeps the identity and swipe outside the scrollable list of %i scopes', count => {
		mockAlwaysShowDetails = true;
		renderRequest(
			Array.from({ length: count }, (_, index) => ({ path: `/priv/scope-${index + 1}/`, permission: 'rwe' })),
		);
		const details = screen.getByTestId('ConfirmAuthDetailsScrollView');
		expect(details).toHaveStyle({ flex: 1 });
		expect(StyleSheet.flatten(details.props.contentContainerStyle)).toMatchObject({ flexGrow: 1 });
		expect(within(details).getAllByRole('switch')).toHaveLength(1);
		expect(within(details).getByText(`/priv/scope-${count}/`)).toBeTruthy();
		expect(within(details).queryByTestId('mock-auth-identity')).toBeNull();
		expect(within(details).queryByTestId('ConfirmAuthAuthorizeButton')).toBeNull();
		expect(screen.getByTestId('mock-auth-identity')).toBeVisible();
		expect(screen.getByTestId('ConfirmAuthAuthorizeButton')).toBeVisible();
	});

	it('declines all encrypted scopes together and preserves all read/write permissions', async () => {
		mockAlwaysShowDetails = true;
		const authUrl = renderRequest([
			{ path: '/priv/chat/', permission: 'rwe' },
			{ path: '/priv/photos/', permission: 're' },
			{ path: '/pub/keys/', permission: 'e' },
			{ path: '/pub/profile/', permission: 'w' },
		]);
		fireEvent.press(screen.getByRole('switch'));
		// Keep declined requests available so users can reconsider before approving.
		expect(screen.getByText('/pub/keys/')).toBeTruthy();
		await approve();
		expect(authWithCapabilities).toHaveBeenCalledWith(
			authUrl,
			'identity-secret',
			'/priv/chat/:rw,/priv/photos/:r,/pub/profile/:w',
		);
		expect(auth).not.toHaveBeenCalled();
		expect(screen.getByTestId('mock-auth-summary').props).toMatchObject({
			authorized: true,
			capabilities: [
				{ path: '/priv/chat/', permission: 'rw' },
				{ path: '/priv/photos/', permission: 'r' },
				{ path: '/pub/profile/', permission: 'w' },
			],
		});
		expect(screen.queryAllByRole('switch')).toHaveLength(0);
		expect(screen.queryByText('/pub/keys/')).toBeNull();
		expect(screen.getByTestId('ConfirmAuthSuccessButton')).toBeVisible();
	});

	it('preserves encryption choices when moving between basics and details', async () => {
		const authUrl = renderRequest([{ path: '/priv/chat/', permission: 'rwe' }]);
		fireEvent.press(screen.getByTestId('ConfirmAuthShowDetailsButton'));
		fireEvent.press(screen.getByRole('switch'));
		fireEvent.press(screen.getByTestId('auth-back-button'));
		expect(screen.getByTestId('mock-auth-summary').props.capabilities).toEqual([
			{ path: '/priv/chat/', permission: 'rw' },
		]);
		fireEvent.press(screen.getByTestId('ConfirmAuthShowDetailsButton'));
		expect(screen.getByRole('switch')).toHaveProp('accessibilityState', { checked: false, disabled: false });
		await approve();
		expect(authWithCapabilities).toHaveBeenCalledWith(authUrl, 'identity-secret', '/priv/chat/:rw');
	});

	it.each(['/priv/chat/', '/priv/chat/file.json', '/'])(
		'uses an empty approval when encryption-only access is declined for %s',
		async path => {
			mockAlwaysShowDetails = true;
			const authUrl = renderRequest([{ path, permission: 'e' }]);
			fireEvent.press(screen.getByRole('switch'));
			await approve();
			expect(authWithCapabilities).toHaveBeenCalledWith(authUrl, 'identity-secret', '');
			expect(auth).not.toHaveBeenCalled();
			expect(screen.getByTestId('mock-auth-summary').props.capabilities).toEqual([]);
		},
	);

	it('can restore all encrypted scopes before approving', async () => {
		mockAlwaysShowDetails = true;
		const authUrl = renderRequest([
			{ path: '/priv/chat/', permission: 'rwe' },
			{ path: '/priv/photos/', permission: 'e' },
		]);
		fireEvent.press(screen.getByRole('switch'));
		fireEvent.press(screen.getByRole('switch'));
		await approve();
		expect(authWithCapabilities).toHaveBeenCalledWith(
			authUrl,
			'identity-secret',
			'/priv/chat/:rwe,/priv/photos/:e',
		);
	});

	it.each([{ capabilities: [] }, { capabilities: [{ path: '/pub/profile/', permission: 'rw' }] }])(
		'uses the original auth method without encryption (%j)',
		async ({ capabilities }) => {
			const authUrl = renderRequest(capabilities);
			expect(screen.queryAllByRole('switch')).toHaveLength(0);
			await approve();
			expect(auth).toHaveBeenCalledWith(authUrl, 'identity-secret');
			expect(authWithCapabilities).not.toHaveBeenCalled();
		},
	);

	it('shows the identity-only details for a request without data permissions', () => {
		mockAlwaysShowDetails = true;
		renderRequest([]);
		expect(screen.getByTestId('ConfirmAuthIdentityVerification')).toBeTruthy();
		expect(screen.getByText('auth.provePubkyControl')).toBeTruthy();
		expect(screen.getByText('auth.identityVerificationWarning')).toBeTruthy();
		expect(screen.queryAllByRole('switch')).toHaveLength(0);
	});

	it('preserves the selected permissions after failure and allows retry', async () => {
		mockAlwaysShowDetails = true;
		jest.mocked(authWithCapabilities).mockResolvedValue(err('Approval failed'));
		const authUrl = renderRequest([{ path: '/priv/chat/', permission: 'rwe' }]);
		fireEvent.press(screen.getByRole('switch'));
		await approve();
		expect(screen.getByRole('switch')).toHaveProp('accessibilityState', { checked: false, disabled: false });
		expect(screen.getByTestId('ConfirmAuthAuthorizeButton')).not.toBeDisabled();
		expect(openXError).toHaveBeenCalled();
		expect(syncAuthorizedGrantsAfterAuth).not.toHaveBeenCalled();
		jest.mocked(authWithCapabilities).mockResolvedValue(ok('success'));
		await approve();
		expect(authWithCapabilities).toHaveBeenCalledTimes(3);
		expect(authWithCapabilities).toHaveBeenLastCalledWith(authUrl, 'identity-secret', '/priv/chat/:rw');
		expect(screen.getByTestId('ConfirmAuthSuccessButton')).toBeVisible();
	});

	it.each(['/priv/chat/:rw', ''])(
		'preserves approval through automatic session retry (%j)',
		async approved => {
			mockAlwaysShowDetails = true;
			jest.mocked(authWithCapabilities).mockResolvedValueOnce(err('Session expired'));
			const authUrl = renderRequest([{ path: '/priv/chat/', permission: approved ? 'rwe' : 'e' }]);
			fireEvent.press(screen.getByRole('switch'));
			await approve();
			expect(signIn).toHaveBeenCalledTimes(1);
			expect(authWithCapabilities).toHaveBeenCalledTimes(2);
			for (const call of jest.mocked(authWithCapabilities).mock.calls)
				expect(call).toEqual([authUrl, 'identity-secret', approved]);
		},
	);

	it('does not restart the timeout when showing details or changing encryption', () => {
		renderRequest([{ path: '/priv/chat/', permission: 'rwe' }]);
		act(() => {
			jest.advanceTimersByTime(30000);
		});
		fireEvent.press(screen.getByTestId('ConfirmAuthShowDetailsButton'));
		fireEvent.press(screen.getByRole('switch'));
		act(() => {
			jest.advanceTimersByTime(30000);
		});
		expect(openXCancel).toHaveBeenCalledTimes(1);
		expect(hideSheet).toHaveBeenCalledWith('auth');
	});

	it('cancels an unanswered request when the sheet is dismissed', () => {
		renderRequest([]);
		act(() => mockDismissSheet?.());
		expect(openXCancel).toHaveBeenCalledTimes(1);
	});

	it('returns success to the calling app without also cancelling', async () => {
		renderRequest([], { xSuccess: 'example://success' });
		await approve();
		cleanup();
		expect(openXSuccess).toHaveBeenCalledWith({ xSuccess: 'example://success' });
		expect(openXCancel).not.toHaveBeenCalled();
	});
});
