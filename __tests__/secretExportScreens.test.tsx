import React from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { ok } from '@synonymdev/result';
import RecoveryPhraseScreen from '../src/screens/RecoveryPhraseScreen';
import MigrateQRCode from '../src/screens/MigrateQRCode';
import RecoveryFilePassphraseScreen from '../src/screens/RecoveryFilePassphraseScreen';
import { getPubkySecretKey } from '../src/utils/pubky';
import { createRecoveryFile } from '@synonymdev/react-native-pubky';
import { backupPubky } from '../src/utils/rnfs';
import { usePrivacyCover } from '../src/hooks/usePrivacyCover';

jest.mock('../src/utils/store-helpers', () => ({
	getStore: () => ({
		settings: { requireDeviceAuth: true },
		pubky: { pubkys: { identity: { name: 'name' } } },
	}),
	getPubkyDataFromStore: () => ({}),
	getBackupPreference: () => 'encryptedFile',
}));
jest.mock('../src/utils/pubky', () => ({
	getPubkySecretKey: jest.fn(),
	truncatePubky: (value: string) => value,
	truncateStr: (value: string) => value,
}));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: () => null,
}));
jest.mock('@react-navigation/native', () => ({
	useFocusEffect: (effect: () => void | (() => void)) => {
		require('react').useEffect(() => (mockFocused ? effect() : undefined), [effect, mockFocused]);
	},
}));
jest.mock('react-redux', () => ({
	useSelector: (selector: () => unknown) => selector(),
	useDispatch: () => jest.fn(),
}));
jest.mock('../src/store/selectors/pubkySelectors', () => ({
	getPubkyName: () => 'Identity',
	getPubkyKeys: () => ['identity'],
}));
jest.mock('../src/hooks/usePubkyManagement', () => ({
	usePubkyManagement: () => ({ confirmPubkyBackup: jest.fn() }),
}));
jest.mock('../src/utils/helpers', () => ({
	isSmallScreen: () => true,
	generateBackupFileName: () => 'backup',
}));
jest.mock('../src/components/Sheet', () => ({ SheetScreen: require('react-native').View }));
jest.mock('../src/theme/components', () => ({ ThemedView: require('react-native').View }));
jest.mock('../src/theme/typography', () => {
	const { Text } = require('react-native');
	return { TextBaseM: Text, TextBaseB: Text, TextSmM: Text, TextSmB: Text, TextXsM: Text, TextXsB: Text };
});
jest.mock('../src/components/PubkyCard', () => () => null);
jest.mock('../src/components/BlurView', () => require('react-native').View);
jest.mock('../src/components/Button', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');
	return ({ text, ...props }: { text: string }) =>
		ReactMock.createElement(Pressable, props, ReactMock.createElement(Text, null, text));
});
jest.mock('../src/components/TextField', () => require('react-native').TextInput);
jest.mock('../src/components/AnimatedQR', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');
	return ({ data }: { data: unknown }) =>
		ReactMock.createElement(Text, { testID: 'qr-data' }, JSON.stringify(data));
});
jest.mock('../src/icons', () => ({ Eye: () => null, EyeOff: () => null, Key: () => null }));
jest.mock('../src/utils/secureWindow', () => ({ setSecureWindow: jest.fn() }));
jest.mock('../src/sheets/sheetNavigation', () => ({ hideSheet: jest.fn() }));
jest.mock('@adrianso/react-native-device-brightness', () => ({
	getBrightnessLevel: jest.fn(async () => 0.5),
	setBrightnessLevel: jest.fn(async () => undefined),
}));
jest.mock('@synonymdev/react-native-pubky', () => ({
	createRecoveryFile: jest.fn(),
	decryptRecoveryFile: jest.fn(),
}));
jest.mock('../src/utils/rnfs', () => ({ backupPubky: jest.fn() }));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));

const phrase = 'one two three four five six seven eight nine ten eleven twelve';
let mockFocused = true;
const mockAppStateListeners = new Set<(state: string) => void>();
const mockBackground = (state: string): void => {
	mockAppStateListeners.forEach(listener => listener(state));
};
beforeEach(() => {
	jest.clearAllMocks();
	mockFocused = true;
	mockAppStateListeners.clear();
	jest.spyOn(AppState, 'addEventListener').mockImplementation(((
		event: string,
		listener: (state: string) => void,
	) => {
		if (event === 'change') mockAppStateListeners.add(listener);
		return { remove: () => mockAppStateListeners.delete(listener) };
	}) as never);
	NativeModules.DeviceAuthentication = { authenticate: jest.fn(async () => true), cancel: jest.fn() };
	NativeModules.PrivacyCover = { setEnabled: jest.fn() };
	jest.mocked(getPubkySecretKey).mockResolvedValue(ok({ secretKey: 'private-key', mnemonic: phrase }));
	jest.mocked(createRecoveryFile).mockResolvedValue(ok('encrypted-content'));
	jest.mocked(backupPubky).mockResolvedValue(ok('backup.pkarr'));
});
afterEach(() => {
	cleanup();
	jest.restoreAllMocks();
});

const sensitiveScreens = [
	[
		'recovery phrase',
		<RecoveryPhraseScreen
			key="recovery"
			route={{ params: { pubky: 'identity' } } as never}
			navigation={{} as never}
		/>,
	],
	['migration QR', <MigrateQRCode key="migration" />],
] as const;

it.each(sensitiveScreens)('scopes the iOS privacy cover to the focused %s screen', (_, component) => {
	jest.replaceProperty(Platform, 'OS', 'ios');
	const { unmount } = render(component);
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenLastCalledWith(true);
	act(() => mockBackground?.('inactive'));
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenCalledTimes(1);
	unmount();
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenLastCalledWith(false);
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenCalledTimes(2);
});

it('disables the iOS cover on navigation blur and restores it on refocus without remounting', () => {
	jest.replaceProperty(Platform, 'OS', 'ios');
	const { rerender, unmount } = renderHook(() => usePrivacyCover());
	mockFocused = false;
	rerender({});
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenLastCalledWith(false);
	mockFocused = true;
	rerender({});
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenLastCalledWith(true);
	unmount();
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenLastCalledWith(false);
	expect(NativeModules.PrivacyCover.setEnabled).toHaveBeenCalledTimes(4);
});

it.each(sensitiveScreens)('leaves Android privacy protection unchanged on the %s screen', (_, component) => {
	jest.replaceProperty(Platform, 'OS', 'android');
	const { unmount } = render(component);
	unmount();
	expect(NativeModules.PrivacyCover.setEnabled).not.toHaveBeenCalled();
});

it.each(sensitiveScreens)(
	'does not reveal a late %s read after becoming inactive',
	async (name, component) => {
		let finishRead!: (result: Awaited<ReturnType<typeof getPubkySecretKey>>) => void;
		jest.mocked(getPubkySecretKey).mockReturnValueOnce(
			new Promise(resolve => {
				finishRead = resolve;
			}),
		);
		render(component);
		await act(async () => {
			fireEvent.press(
				screen.getByTestId(
					name === 'recovery phrase' ? 'RecoveryPhraseRevealButton' : 'MigrateQRCodeRevealButton',
				),
			);
		});
		expect(getPubkySecretKey).toHaveBeenCalledTimes(1);
		act(() => {
			mockBackground('inactive');
			mockBackground('active');
		});
		await act(async () => {
			finishRead(ok({ secretKey: 'private-key', mnemonic: phrase }));
		});
		if (name === 'recovery phrase') {
			expect(screen.queryByText('one')).toBeNull();
		} else {
			expect(screen.getByTestId('qr-data').props.children).not.toContain('private-key');
		}
	},
);

it('allows the inactive transition caused by the OS authentication prompt', async () => {
	NativeModules.DeviceAuthentication.authenticate.mockImplementationOnce(async () => {
		mockBackground('inactive');
		mockBackground('active');
		return true;
	});
	render(sensitiveScreens[0][1]);
	await act(async () => {
		fireEvent.press(screen.getByTestId('RecoveryPhraseRevealButton'));
	});
	expect(screen.getByText('one')).toBeTruthy();
});

it('loads a recovery phrase only after the reveal challenge, and hides it on background', async () => {
	render(
		<RecoveryPhraseScreen route={{ params: { pubky: 'identity' } } as never} navigation={{} as never} />,
	);
	expect(getPubkySecretKey).not.toHaveBeenCalled();
	expect(screen.queryByText('one')).toBeNull();
	await act(async () => {
		fireEvent.press(screen.getByTestId('RecoveryPhraseRevealButton'));
	});
	expect(NativeModules.DeviceAuthentication.authenticate).toHaveBeenCalledTimes(1);
	expect(screen.getByText('one')).toBeTruthy();
	act(() => {
		mockBackground?.('background');
	});
	expect(screen.queryByText('one')).toBeNull();
	await act(async () => {
		fireEvent.press(screen.getByTestId('RecoveryPhraseRevealButton'));
	});
	expect(NativeModules.DeviceAuthentication.authenticate).toHaveBeenCalledTimes(2);
});

it('offers file backup after authentication when the identity has no recovery phrase', async () => {
	jest.mocked(getPubkySecretKey).mockResolvedValueOnce(ok({ secretKey: 'private-key', mnemonic: '' }));
	const replace = jest.fn();
	render(
		<RecoveryPhraseScreen
			route={{ params: { pubky: 'identity' } } as never}
			navigation={{ replace } as never}
		/>,
	);
	expect(getPubkySecretKey).not.toHaveBeenCalled();
	await act(async () => {
		fireEvent.press(screen.getByTestId('RecoveryPhraseRevealButton'));
	});
	expect(NativeModules.DeviceAuthentication.authenticate).toHaveBeenCalledTimes(1);
	expect(screen.getByText('backup.recoveryPhraseUnavailable')).toBeTruthy();
	expect(screen.queryByTestId('RecoveryPhraseFinishButton')).toBeNull();
	fireEvent.press(screen.getByTestId('RecoveryPhraseFileBackupButton'));
	expect(replace).toHaveBeenCalledWith('BackupFileScreen', { pubky: 'identity' });
	expect(createRecoveryFile).not.toHaveBeenCalled();
	expect(backupPubky).not.toHaveBeenCalled();
});

it('never reveals a recovery phrase after cancelling the OS prompt', async () => {
	NativeModules.DeviceAuthentication.authenticate.mockRejectedValueOnce({ code: 'cancelled' });
	render(
		<RecoveryPhraseScreen route={{ params: { pubky: 'identity' } } as never} navigation={{} as never} />,
	);
	await act(async () => {
		fireEvent.press(screen.getByTestId('RecoveryPhraseRevealButton'));
	});
	expect(getPubkySecretKey).not.toHaveBeenCalled();
	expect(screen.queryByText('one')).toBeNull();
});

it('does not read migration secrets on mount; authenticates again after hiding the QR', async () => {
	render(<MigrateQRCode />);
	expect(getPubkySecretKey).not.toHaveBeenCalled();
	expect(screen.getByTestId('qr-data').props.children).not.toContain('private-key');
	await act(async () => {
		fireEvent.press(screen.getByTestId('MigrateQRCodeRevealButton'));
	});
	expect(screen.getByTestId('qr-data').props.children).toContain('private-key');
	act(() => {
		mockBackground?.('background');
	});
	expect(screen.getByTestId('qr-data').props.children).not.toContain('private-key');
	await act(async () => {
		fireEvent.press(screen.getByTestId('MigrateQRCodeRevealButton'));
	});
	expect(NativeModules.DeviceAuthentication.authenticate).toHaveBeenCalledTimes(2);
});

it('does not export an encrypted backup when device authentication fails', async () => {
	NativeModules.DeviceAuthentication.authenticate.mockRejectedValueOnce({ code: 'failed' });
	render(
		<RecoveryFilePassphraseScreen
			promptPayload={{ mode: 'backup', pubky: 'identity' }}
			sheetId="backup"
			onImportSuccess={jest.fn()}
		/>,
	);
	fireEvent.changeText(screen.getByTestId('BackupFilePassphraseInput'), 'a long enough password');
	await act(async () => {
		fireEvent.press(screen.getByTestId('BackupFileSubmitButton'));
	});
	expect(getPubkySecretKey).not.toHaveBeenCalled();
	expect(createRecoveryFile).not.toHaveBeenCalled();
	expect(backupPubky).not.toHaveBeenCalled();
});

it('authenticates before creating and exporting an encrypted backup', async () => {
	render(
		<RecoveryFilePassphraseScreen
			promptPayload={{ mode: 'backup', pubky: 'identity' }}
			sheetId="backup"
			onImportSuccess={jest.fn()}
		/>,
	);
	fireEvent.changeText(screen.getByTestId('BackupFilePassphraseInput'), 'a long enough password');
	await act(async () => {
		fireEvent.press(screen.getByTestId('BackupFileSubmitButton'));
	});
	expect(createRecoveryFile).toHaveBeenCalledWith('private-key', 'a long enough password');
	expect(backupPubky).toHaveBeenCalledWith('encrypted-content', 'backup', expect.any(Object));
});
