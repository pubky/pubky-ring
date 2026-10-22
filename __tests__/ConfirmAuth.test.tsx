import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { err, ok } from '@synonymdev/result';
import { auth, authWithCapabilities, republishHomeserver, signIn } from '@synonymdev/react-native-pubky';
import type { PubkyAuthDetails } from '@synonymdev/react-native-pubky';
import ConfirmAuth from '../src/screens/ConfirmAuth';
import { getKeychainValue, setSessionSecret } from '../src/utils/keychain';
import { getPubkyDataFromStore } from '../src/utils/store-helpers';
import { syncAuthorizedGrantsAfterAuth } from '../src/utils/authorizedGrants';
import { defaultPubkyState } from '../src/store/shapes/pubky';
import type { AuthCapability } from '../src/utils/authCapabilities';

const mockDispatch = jest.fn();

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
	useSelector: (selector: (state: unknown) => unknown) => selector({}),
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
	useSharedValue: (initialValue: number) => require('react').useState(() => ({ value: initialValue }))[0],
	useAnimatedStyle: () => ({}),
	withTiming: (value: number) => value,
	withSequence: (...values: number[]) => values.at(-1),
}));

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { View, Text } = require('react-native');
	return {
		SheetScreen: ({ children, title }: { children: React.ReactNode; title: string }) =>
			ReactMock.createElement(View, null, ReactMock.createElement(Text, null, title), children),
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
jest.mock('../src/components/PubkyCard.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/SafeAreaInset.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/ProgressBar.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/CircularProgressBar.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/theme/typography', () => {
	const { Text } = require('react-native');
	return { TextSmM: Text, TextXsM: Text };
});
jest.mock('../src/icons/index.ts', () => ({
	CheckCircle: () => null,
	Folder: () => null,
	Key: () => null,
}));

const renderRequest = (capabilities: AuthCapability[]): string => {
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
			route={{ params: { pubky: 'test-pubky', authUrl, authDetails } } as never}
			navigation={{} as never}
		/>,
	);
	return authUrl;
};

const approve = async (): Promise<void> => {
	await act(async () => {
		fireEvent.press(screen.getByTestId('ConfirmAuthAuthorizeButton'));
	});
};

describe('ConfirmAuth selective approval integration', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.clearAllMocks();
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

	it('submits the toggled capability subset and omits declined encryption-only scopes on success', async () => {
		const authUrl = renderRequest([
			{ path: '/priv/chat/', permission: 'rwe' },
			{ path: '/pub/keys/', permission: 'e' },
			{ path: '/pub/profile/', permission: 'r' },
		]);
		for (const toggle of screen.getAllByRole('switch')) {
			fireEvent(toggle, 'valueChange', false);
		}
		// Declining encryption must not remove the request before the user can reconsider it.
		expect(screen.getByText('/pub/keys/')).toBeTruthy();
		await approve();

		expect(auth).not.toHaveBeenCalled();
		expect(authWithCapabilities).toHaveBeenCalledWith(
			authUrl,
			'identity-secret',
			'/priv/chat/:rw,/pub/profile/:r',
		);
		expect(screen.getByTestId('ConfirmAuthGrantedPermissions')).toBeTruthy();
		expect(screen.getByText('/priv/chat/')).toBeTruthy();
		expect(screen.getByText('/pub/profile/')).toBeTruthy();
		expect(screen.queryByText('/pub/keys/')).toBeNull();
		expect(screen.queryByText('auth.encryptAndDecryptFolder')).toBeNull();
		expect(screen.queryAllByRole('switch')).toHaveLength(0);
	});

	it.each(['/priv/chat/', '/priv/chat/file.json', '/'])(
		'passes an empty approval and hides the declined encryption-only scope %s',
		async path => {
			const authUrl = renderRequest([{ path, permission: 'e' }]);
			fireEvent(screen.getByRole('switch'), 'valueChange', false);
			await approve();

			expect(auth).not.toHaveBeenCalled();
			expect(authWithCapabilities).toHaveBeenCalledWith(authUrl, 'identity-secret', '');
			expect(screen.getByTestId('ConfirmAuthGrantedPermissions')).toBeTruthy();
			expect(screen.queryByText(path)).toBeNull();
		},
	);

	it('declines encryption only for the selected scope without stripping another scope', async () => {
		const authUrl = renderRequest([
			{ path: '/priv/chat/', permission: 'rwe' },
			{ path: '/priv/photos/', permission: 'rwe' },
		]);
		fireEvent(screen.getAllByRole('switch')[0], 'valueChange', false);
		await approve();

		expect(authWithCapabilities).toHaveBeenCalledWith(
			authUrl,
			'identity-secret',
			'/priv/chat/:rw,/priv/photos/:rwe',
		);
		expect(auth).not.toHaveBeenCalled();
		expect(screen.getByText('/priv/chat/')).toBeTruthy();
		expect(screen.getByText('/priv/photos/')).toBeTruthy();
		expect(screen.getAllByText('auth.encryptAndDecryptFolder')).toHaveLength(1);
	});

	it('preserves approved encryption scopes and their success display', async () => {
		const authUrl = renderRequest([{ path: '/priv/chat/', permission: 'e' }]);
		await approve();

		expect(authWithCapabilities).toHaveBeenCalledWith(authUrl, 'identity-secret', '/priv/chat/:e');
		expect(auth).not.toHaveBeenCalled();
		expect(screen.getByText('/priv/chat/')).toBeTruthy();
		expect(screen.getByText('auth.encryptAndDecryptFolder')).toBeTruthy();
	});

	it('uses the original auth method when no encryption is requested', async () => {
		const authUrl = renderRequest([{ path: '/pub/profile/', permission: 'rw' }]);
		expect(screen.queryAllByRole('switch')).toHaveLength(0);
		await approve();

		expect(auth).toHaveBeenCalledWith(authUrl, 'identity-secret');
		expect(authWithCapabilities).not.toHaveBeenCalled();
		expect(screen.getByTestId('ConfirmAuthGrantedPermissions')).toBeTruthy();
	});

	it.each(['/priv/chat/:rw', ''])(
		'preserves the selective approval through automatic retry (%j)',
		async approved => {
			jest.mocked(authWithCapabilities).mockResolvedValueOnce(err('Session expired'));
			const permission = approved ? 'rwe' : 'e';
			const authUrl = renderRequest([{ path: '/priv/chat/', permission }]);
			fireEvent(screen.getByRole('switch'), 'valueChange', false);
			await approve();

			expect(signIn).toHaveBeenCalledTimes(1);
			expect(auth).not.toHaveBeenCalled();
			expect(authWithCapabilities).toHaveBeenCalledTimes(2);
			for (const call of jest.mocked(authWithCapabilities).mock.calls) {
				expect(call).toEqual([authUrl, 'identity-secret', approved]);
			}
			expect(screen.getByTestId('ConfirmAuthGrantedPermissions')).toBeTruthy();
		},
	);

	it('retains the original auth method during automatic retry without encryption', async () => {
		jest.mocked(auth).mockResolvedValueOnce(err('Session expired'));
		const authUrl = renderRequest([{ path: '/pub/profile/', permission: 'rw' }]);
		await approve();

		expect(signIn).toHaveBeenCalledTimes(1);
		expect(auth).toHaveBeenCalledTimes(2);
		for (const call of jest.mocked(auth).mock.calls) {
			expect(call).toEqual([authUrl, 'identity-secret']);
		}
		expect(authWithCapabilities).not.toHaveBeenCalled();
		expect(screen.getByTestId('ConfirmAuthGrantedPermissions')).toBeTruthy();
	});
});
