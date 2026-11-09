import React from 'react';
import { Alert, Keyboard, Pressable, Text, View } from 'react-native';
import { render, screen, fireEvent, act, cleanupAsync, within } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ok, err } from '@synonymdev/result';
import HomeserversScreen from '../src/screens/HomeserversScreen';
import HomeserverFormScreen from '../src/screens/HomeserverFormScreen';
import EditPubkyMain from '../src/screens/EditPubkyMain';
import EditPubkyScanner from '../src/screens/EditPubkyScanner';
import EditPubkySelectServer from '../src/screens/EditPubkySelectServer';
import EditPubkySheet from '../src/sheets/EditPubkySheet';
import { EditPubkyFlowProvider, useEditPubkyFlow } from '../src/components/EditPubky/EditPubkyFlowContext';
import reducer, { addHomeserver, setPubkyData } from '../src/store/slices/pubkysSlice';
import type { Dispatch } from 'redux';
import { defaultHomeserver, defaultPubkyState, initialState } from '../src/store/shapes/pubky';
import {
	getPubkySecretKey,
	signUpToHomeserver,
	signOutRingFromHomeserver,
	signInToHomeserver,
} from '../src/utils/pubky';
import { resolveHomeserver } from '../src/utils/resolveHomeserver';
import { parseInput, InputAction } from '../src/utils/inputParser';
import { readFromClipboard } from '../src/utils/clipboard';
import { hideSheet, openHomeserverSettings } from '../src/sheets/sheetNavigation';
import { showToast } from '@synonymdev/react-native-toast';
import type { Pubky } from '../src/types/pubky';
import { PRODUCTION_HOMESERVER, STAGING_HOMESERVER } from '../src/utils/constants';
import { sanitizePubkySessions } from '../src/store/transforms/pubkyPersistence';
import { HomeserverChangedError } from '../src/utils/homeserverChangedError';

jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('react-redux', () => jest.requireActual('../node_modules/react-redux/dist/cjs/index.js'));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../src/i18n', () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock('../src/utils/pubky', () => ({
	getPubkySecretKey: jest.fn(),
	signUpToHomeserver: jest.fn(),
	signInToHomeserver: jest.fn(),
	signOutRingFromHomeserver: jest.fn(),
	truncatePubky: (key: string) => key,
	truncateStr: (key: string) => key,
}));
jest.mock('../src/utils/helpers', () => ({
	formatSignupToken: (text: string) =>
		text
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, '')
			.match(/.{1,4}/g)
			?.join('-') ?? '',
	isValidSignupTokenFormat: (text: string) => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(text),
}));
jest.mock('../src/utils/clipboard', () => ({ readFromClipboard: jest.fn() }));
jest.mock('../src/utils/resolveHomeserver', () => ({ resolveHomeserver: jest.fn() }));
jest.mock('../src/utils/inputParser', () => ({
	InputAction: {
		DirectSignup: 'direct_signup',
		Signup: 'signup',
		Invite: 'invite',
		Auth: 'auth',
		Unknown: 'unknown',
	},
	parseInput: jest.fn(),
}));
jest.mock('../src/sheets/sheetNavigation', () => ({
	hideSheet: jest.fn(),
	openHomeserverSettings: jest.fn(),
}));
jest.mock('@synonymdev/react-native-toast', () => ({ showToast: jest.fn() }));
jest.mock('../src/icons', () => ({
	Scan: () => null,
	Pencil: () => null,
	Trash2: () => null,
	Plus: () => null,
	Gear: () => null,
	Check: () => null,
	XLogo: () => null,
}));
jest.mock('../src/components/AppHeader', () => ({
	__esModule: true,
	default: () => null,
	HEADER_HEIGHT: 56,
}));
jest.mock('../src/components/SafeAreaView', () => ({
	__esModule: true,
	default: require('react-native').View,
}));
jest.mock('../src/components/Sheet', () => ({
	SheetScreen: require('react-native').View,
	SheetFrame: require('react-native').View,
}));
jest.mock('@react-navigation/native-stack', () => {
	const ReactMock = require('react');
	return {
		createNativeStackNavigator: () => ({
			Navigator: ({ children }: { children: React.ReactNode }) => ReactMock.Children.toArray(children)[0],
			Screen: ({ component, initialParams }: { component: React.ElementType; initialParams: unknown }) =>
				ReactMock.createElement(component, { route: { params: initialParams }, navigation: {} }),
		}),
	};
});
jest.mock('../src/components/Button', () => {
	const ReactMock = require('react');
	const { Pressable: Press, Text: Label } = require('react-native');
	return {
		__esModule: true,
		default: ({
			text,
			loading,
			disabled,
			onPress,
			testID,
		}: {
			text: string;
			loading?: boolean;
			disabled?: boolean;
			onPress: () => void;
			testID: string;
		}) =>
			ReactMock.createElement(
				Press,
				{ disabled: disabled || loading, onPress, testID },
				ReactMock.createElement(Label, null, text),
			),
	};
});
jest.mock('../src/components/TextField', () => {
	const ReactMock = require('react');
	const { TextInput } = require('react-native');
	return {
		__esModule: true,
		default: ReactMock.forwardRef((props: object, ref: unknown) =>
			ReactMock.createElement(TextInput, { ...props, ref }),
		),
	};
});
jest.mock('../src/components/ServerCard', () => {
	const ReactMock = require('react');
	const { Pressable: Press, Text: Label } = require('react-native');
	return {
		__esModule: true,
		default: ({
			name,
			publicKey,
			onPress,
			testID,
			headerRight,
		}: {
			name: string;
			publicKey: string;
			onPress?: () => void;
			testID?: string;
			headerRight?: React.ReactNode;
		}) =>
			ReactMock.createElement(
				Press,
				{ onPress, testID },
				ReactMock.createElement(Label, null, name),
				ReactMock.createElement(Label, null, publicKey),
				headerRight,
			),
	};
});
jest.mock('../src/theme/components', () => ({
	ThemedView: require('react-native').View,
	ActivityIndicator: require('react-native').ActivityIndicator,
}));
jest.mock('../src/theme/typography', () => ({
	TextBaseB: require('react-native').Text,
	TextBaseM: require('react-native').Text,
	TextSmM: require('react-native').Text,
	TextXsM: require('react-native').Text,
}));
let mockScannerProps: { onScan: (data: string) => Promise<void>; onCopyClipboard: () => Promise<void> };
jest.mock('../src/components/QRScannerContent', () => {
	const ReactMock = require('react');
	const { View: ScannerView } = require('react-native');
	return {
		__esModule: true,
		default: (props: typeof mockScannerProps) => {
			mockScannerProps = props;
			return ReactMock.createElement(ScannerView);
		},
	};
});

const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const confirmSignOut = async (): Promise<void> => {
	const confirm = alert.mock.calls.at(-1)?.[2]?.find(button => button.style === 'destructive');
	await act(async () => {
		await confirm?.onPress?.();
	});
};
const CUSTOM = 'y'.repeat(52);
const getSecret = getPubkySecretKey as jest.Mock;
const signup = signUpToHomeserver as jest.Mock;
const signin = signInToHomeserver as jest.Mock;
const resolveServer = resolveHomeserver as jest.Mock;
const signOutRing = signOutRingFromHomeserver as jest.Mock;
const completeSignOut = ({
	pubky,
	homeserver,
	dispatch,
}: {
	pubky: string;
	homeserver: string;
	dispatch: Dispatch;
}) => {
	dispatch(
		setPubkyData({
			pubky,
			data: { homeserver, lastKnownHomeserver: homeserver, signedUp: false, sessions: [], signupToken: '' },
		}),
	);
	return ok({ homeserver, cleanupPending: false });
};
const parse = parseInput as jest.Mock;
const clipboard = readFromClipboard as jest.Mock;
const navigation = { navigate: jest.fn(), goBack: jest.fn(), popToTop: jest.fn() };
const route = { params: { pubky: 'existing-key' } } as never;
const Probe = () => {
	const flow = useEditPubkyFlow();
	return (
		<>
			<Text testID="selected">{flow.selectedHomeserver}</Text>
			<Pressable testID="chooseCustom" onPress={() => flow.setSelectedHomeserver(CUSTOM)} />
			<Pressable
				testID="chooseDefault"
				onPress={() => flow.setSelectedHomeserver(defaultHomeserver.publicKey)}
			/>
		</>
	);
};
const setup = (
	data: Partial<Pubky> = {},
	initialServer = defaultHomeserver.publicKey,
	child: React.ReactNode = <EditPubkyMain navigation={navigation as never} route={route} />,
	preferredHomeserver = defaultHomeserver.publicKey,
) => {
	const store = configureStore({
		reducer: { pubky: reducer },
		preloadedState: {
			pubky: {
				...initialState,
				preferredHomeserver,
				pubkys: {
					'existing-key': { ...defaultPubkyState, homeserver: defaultHomeserver.publicKey, ...data },
				},
			},
		},
	});
	render(
		<Provider store={store}>
			<SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom: 34, left: 0 }}>
				<EditPubkyFlowProvider initialHomeserver={initialServer}>
					{child}
					<Probe />
				</EditPubkyFlowProvider>
			</SafeAreaInsetsContext.Provider>
		</Provider>,
	);
	return store;
};
beforeEach(() => {
	jest.clearAllMocks();
	getSecret.mockResolvedValue(ok({ secretKey: 'secret' }));
	signup.mockResolvedValue(ok({}));
	signin.mockResolvedValue(ok({}));
	resolveServer.mockResolvedValue(ok(undefined));
	signOutRing.mockImplementation(async args => completeSignOut(args));
});

describe('Pubky homeserver UI', () => {
	it.each([
		{ name: 'new Synonym signup', homeserver: defaultHomeserver.publicKey, remembered: false },
		{ name: 'custom signup without an invite', homeserver: CUSTOM, remembered: false },
		{ name: 'signed-out account', homeserver: CUSTOM, remembered: true },
	])(
		'Done on the label keeps $name open and leaves explicit Save available',
		async ({ homeserver, remembered }) => {
			const store = setup(
				{ signedUp: false, homeserver, ...(remembered ? { lastKnownHomeserver: homeserver } : {}) },
				homeserver,
			);
			await act(async () => {});
			const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
			fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'New label');
			await act(async () => fireEvent(screen.getByTestId('EditPubkyNameInput'), 'submitEditing'));
			expect(dismiss).toHaveBeenCalled();
			expect(hideSheet).not.toHaveBeenCalled();
			expect(signup).not.toHaveBeenCalled();
			expect(signin).not.toHaveBeenCalled();
			expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
			await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
			expect(store.getState().pubky.pubkys['existing-key'].name).toBe('New label');
			expect(hideSheet).toHaveBeenCalledTimes(1);
			dismiss.mockRestore();
		},
	);
	it.each([
		{ label: 'signed-out account', data: { homeserver: CUSTOM, lastKnownHomeserver: CUSTOM }, visible: true },
		{ label: 'discovered account', data: { homeserver: CUSTOM }, visible: true },
		{ label: 'new unconfigured key', data: { homeserver: '' }, visible: false },
	])(
		'shows the migration notice for a $label only when an existing account is known',
		({ data, visible }) => {
			setup(
				{ ...data, signedUp: false },
				CUSTOM,
				<EditPubkySelectServer navigation={navigation as never} route={route} />,
			);
			expect(Boolean(screen.queryByText('selectServer.migrationNotice'))).toBe(visible);
		},
	);
	it.each([true, false])(
		'reports partial cleanup after sign-out and follows the public server (changed=%s)',
		async changed => {
			const homeserver = changed ? CUSTOM : defaultHomeserver.publicKey;
			const pending = {
				id: 'old-A',
				grant_id: 'grant-A',
				homeserver: changed ? defaultHomeserver.publicKey : CUSTOM,
				cleanupOnly: true,
				created_at: 1,
				capabilities: ['/:rw'],
			};
			signOutRing.mockImplementationOnce(async ({ pubky, dispatch }) => {
				dispatch(
					setPubkyData({
						pubky,
						data: { homeserver, lastKnownHomeserver: homeserver, signedUp: false, sessions: [pending] },
					}),
				);
				return ok({ homeserver, cleanupPending: true });
			});
			const store = setup({ signedUp: true, name: 'Original' });
			fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Draft');
			fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
			await confirmSignOut();
			expect(screen.getByTestId('selected')).toHaveTextContent(homeserver);
			expect(store.getState().pubky.pubkys['existing-key'].sessions).toEqual([pending]);
			expect(screen.getByTestId('EditPubkyNameInput').props.value).toBe('Draft');
			expect(showToast).toHaveBeenCalledWith({
				type: 'info',
				title: changed ? 'homeservers.changedNotice' : 'homeservers.signedOut',
				description: 'homeservers.cleanupPending',
			});
			fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Original');
			expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
			expect(screen.queryByTestId('EditPubkyRemoveServerButton')).toBeNull();
			await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
			expect(signin).toHaveBeenCalledWith(expect.objectContaining({ homeserver, allowRepublish: false }));
			expect(signup).not.toHaveBeenCalled();
		},
	);
	it.each([CUSTOM, defaultHomeserver.publicKey])(
		'opens fresh-key setup immediately on its preferred server %s without discovery',
		async homeserver => {
			resolveServer.mockImplementation(() => new Promise<never>(() => {}));
			const store = configureStore({
				reducer: { pubky: reducer },
				preloadedState: {
					pubky: {
						...initialState,
						preferredHomeserver: homeserver,
						homeservers: {
							...initialState.homeservers,
							[CUSTOM]: { publicKey: CUSTOM, name: 'Personal' },
						},
						pubkys: { 'new-key': { ...defaultPubkyState } },
					},
				},
			});
			const before = store.getState();
			render(
				<Provider store={store}>
					<EditPubkySheet
						navigation={navigation as never}
						route={{ params: { pubky: 'new-key', justCreated: true } } as never}
					/>
				</Provider>,
			);
			expect(resolveServer).not.toHaveBeenCalled();
			expect(screen.queryByTestId('EditPubkyHomeserverLookupProgress')).toBeNull();
			expect(screen.getByText('selectServer.defaultName')).toBeTruthy();
			expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
			expect(store.getState()).toEqual(before);
			if (homeserver === defaultHomeserver.publicKey) {
				expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
				fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), 'ABCD-1234-WXYZ');
			} else expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
			expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
			await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
			expect(signup).toHaveBeenCalledWith(expect.objectContaining({ pubky: 'new-key', homeserver }));
			expect(signin).not.toHaveBeenCalled();
		},
	);
	it('looks up a cancelled fresh key when setup is reopened without the creation flag', async () => {
		const store = setup(
			{ homeserver: '', signedUp: false },
			'',
			<EditPubkySheet
				navigation={navigation as never}
				route={{ params: { pubky: 'existing-key', justCreated: true } } as never}
			/>,
		);
		expect(resolveServer).not.toHaveBeenCalled();
		fireEvent.press(screen.getByTestId('EditPubkyCancelButton'));
		const savedPubky = JSON.parse(JSON.stringify(sanitizePubkySessions(store.getState().pubky))).pubkys[
			'existing-key'
		];
		expect(savedPubky).not.toHaveProperty('justCreated');
		expect(savedPubky.homeserver).toBe('');
		await cleanupAsync();
		resolveServer.mockResolvedValueOnce(ok(CUSTOM));
		setup(savedPubky, '');
		await act(async () => {});
		expect(resolveServer).toHaveBeenCalledWith('existing-key');
		expect(screen.getByTestId('selected')).toHaveTextContent(CUSTOM);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(signup).not.toHaveBeenCalled();
	});
	it('dismisses the keyboard with Done even when an invalid invite prevents signup', async () => {
		const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
		setup({ signedUp: false });
		await act(async () => {});
		fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), 'BAD');
		expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
		await act(async () => fireEvent(screen.getByTestId('EditPubkyInviteCodeInput'), 'submitEditing'));
		expect(dismiss).toHaveBeenCalledTimes(1);
		expect(signup).not.toHaveBeenCalled();
		expect(signin).not.toHaveBeenCalled();
		expect(hideSheet).not.toHaveBeenCalled();
		dismiss.mockRestore();
	});
	it('switches the bottom action between Save and Sign up as server edits are made and reverted', async () => {
		const store = setup({ name: 'Original', signedUp: true });
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Renamed');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		fireEvent.press(screen.getByTestId('chooseCustom'));
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
		fireEvent.press(screen.getByTestId('chooseDefault'));
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		expect(screen.queryByTestId('EditPubkyConnectButton')).toBeNull();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Renamed');
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		expect(signup).not.toHaveBeenCalled();
		expect(signin).not.toHaveBeenCalled();
	});
	it('switches to Sign up for invite edits and back to label-only Save when they are cleared', async () => {
		const store = setup({ name: 'Original', signedUp: false });
		await act(async () => {});
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Renamed');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), 'BAD');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
		expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
		fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), '');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Renamed');
		expect(signup).not.toHaveBeenCalled();
	});
	it('returns to Sign in when the label edit is reverted, without treating discovery as an edit', async () => {
		resolveServer.mockResolvedValueOnce(ok(CUSTOM));
		const store = setup({ name: 'Original', signedUp: false, homeserver: '' });
		await act(async () => {});
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Renamed');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), ' Original ');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Original');
		expect(signin).toHaveBeenCalledWith(expect.objectContaining({ homeserver: CUSTOM }));
		expect(signup).not.toHaveBeenCalled();
	});
	it.each(['pending lookup', 'failed lookup', 'missing invite', 'signed out', 'invalid stored homeserver'])(
		'saves just the label independently of %s',
		async scenario => {
			if (scenario === 'pending lookup') resolveServer.mockReturnValueOnce(new Promise(() => {}));
			else if (scenario === 'failed lookup') resolveServer.mockResolvedValueOnce(err('Offline'));
			else if (scenario === 'signed out')
				resolveServer.mockResolvedValueOnce(ok(defaultHomeserver.publicKey));
			const invalidServer = scenario === 'invalid stored homeserver';
			const store = setup(
				{
					name: 'Original',
					signedUp: invalidServer,
					homeserver: invalidServer ? 'invalid-server' : defaultHomeserver.publicKey,
				},
				invalidServer ? 'invalid-server' : defaultHomeserver.publicKey,
			);
			await act(async () => {});
			const previousData = store.getState().pubky.pubkys['existing-key'];
			fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), '  Renamed  ');
			expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
			expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
			await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
			expect(store.getState().pubky.pubkys['existing-key']).toEqual({ ...previousData, name: 'Renamed' });
			expect(getSecret).not.toHaveBeenCalled();
			expect(signup).not.toHaveBeenCalled();
			expect(signin).not.toHaveBeenCalled();
			expect(signOutRing).not.toHaveBeenCalled();
			expect(hideSheet).toHaveBeenCalledWith('edit-pubky');
		},
	);
	it('can save the label after a rejected connection without retrying it', async () => {
		signup.mockResolvedValueOnce(err('Invalid token'));
		const store = setup({ name: 'Original', signedUp: false }, CUSTOM);
		await act(async () => {});
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Original');
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Renamed');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Renamed');
		expect(signup).toHaveBeenCalledTimes(1);
		expect(signin).not.toHaveBeenCalled();
	});
	it('keeps invite entry hidden for an unchanged configured server and renames without signup', async () => {
		const store = setup({ name: 'Old', signedUp: true });
		expect(screen.getByTestId('EditPubkyHomeserverLabel')).toHaveTextContent(
			'editPubkySheet.homeserverLabel',
		);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		expect(screen.getByTestId('EditPubkyRemoveServerButton')).toBeTruthy();
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(screen.queryByTestId('EditPubkyShowInviteButton')).toBeNull();
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'New');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('New');
		expect(signup).not.toHaveBeenCalled();
	});
	it('asks before signing out and keeps the selection when confirmation is cancelled', () => {
		const store = setup({ signedUp: true });
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		expect(alert).toHaveBeenCalledWith(
			'homeservers.signOutTitle',
			'homeservers.signOutDescription',
			expect.arrayContaining([
				expect.objectContaining({ text: 'homeservers.signOutAction', style: 'destructive' }),
			]),
			expect.any(Object),
		);
		expect(signOutRing).not.toHaveBeenCalled();
		alert.mock.calls
			.at(-1)?.[2]
			?.find(button => button.style === 'cancel')
			?.onPress?.();
		expect(signOutRing).not.toHaveBeenCalled();
		expect(screen.getByTestId('selected').props.children).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.pubkys['existing-key'].signedUp).toBe(true);
	});
	it('signs out immediately after confirmation, without saving the edited name', async () => {
		const store = setup({ signedUp: true, name: 'Original' });
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Unsaved draft');
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		await confirmSignOut();
		expect(signOutRing).toHaveBeenCalledTimes(1);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.pubkys['existing-key'].signedUp).toBe(false);
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Original');
		expect(screen.getByTestId('EditPubkyNameInput').props.value).toBe('Unsaved draft');
		expect(screen.queryByTestId('EditPubkyRemoveServerButton')).toBeNull();
		expect(screen.getByTestId('EditPubkyHomeserverLabel')).toHaveTextContent(
			'editPubkySheet.homeserverLabel',
		);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('common.save');
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Unsaved draft');
		expect(signin).not.toHaveBeenCalled();
		expect(signup).not.toHaveBeenCalled();
	});
	it('remembers the verified account through sign-out and persistence without rediscovering it as a signup', async () => {
		const store = setup({ signedUp: true, name: 'Original' });
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		await confirmSignOut();
		const persisted = JSON.parse(JSON.stringify(sanitizePubkySessions(store.getState().pubky)));
		const savedPubky = persisted.pubkys['existing-key'];
		expect(savedPubky.lastKnownHomeserver).toBe(defaultHomeserver.publicKey);
		expect(savedPubky.signedUp).toBe(false);
		expect(savedPubky.sessions).toEqual([]);
		expect(savedPubky.signupToken).toBe('');
		await cleanupAsync();
		// A fresh discovery can miss this recently published account after a restart.
		resolveServer.mockResolvedValueOnce(ok(undefined));
		setup(savedPubky, savedPubky.homeserver);
		await act(async () => {});
		expect(resolveServer).not.toHaveBeenCalled();
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signin).toHaveBeenCalledWith(
			expect.objectContaining({ homeserver: defaultHomeserver.publicKey, allowRepublish: false }),
		);
		expect(signup).not.toHaveBeenCalled();
	});
	it('keeps a remembered account on sign-in failure without falling back to signup', async () => {
		signin.mockResolvedValueOnce(err('Offline'));
		const store = setup({ signedUp: false, lastKnownHomeserver: defaultHomeserver.publicKey });
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(screen.getByText('editPubkySheet.unableToSignIn')).toBeTruthy();
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(signup).not.toHaveBeenCalled();
		expect(store.getState().pubky.pubkys['existing-key'].lastKnownHomeserver).toBe(
			defaultHomeserver.publicKey,
		);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		expect(showToast).not.toHaveBeenCalled();
	});
	it('offers Sign in when the only retained grant is pending cleanup', () => {
		setup(
			{
				signedUp: false,
				homeserver: CUSTOM,
				lastKnownHomeserver: CUSTOM,
				sessions: [
					{
						id: 'pending',
						grant_id: 'pending-grant',
						created_at: 1,
						capabilities: ['/:rw'],
						cleanupOnly: true,
						homeserver: CUSTOM,
					},
				],
			},
			CUSTOM,
		);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
		expect(screen.queryByTestId('EditPubkyRemoveServerButton')).toBeNull();
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(resolveServer).not.toHaveBeenCalled();
	});
	it('corrects a remembered server mismatch and lets the user sign in again without an invite', async () => {
		const movedServer =
			defaultHomeserver.publicKey === PRODUCTION_HOMESERVER ? STAGING_HOMESERVER : PRODUCTION_HOMESERVER;
		signin.mockResolvedValueOnce(err(new HomeserverChangedError(movedServer, 'Changed')));
		const store = setup({
			signedUp: false,
			lastKnownHomeserver: defaultHomeserver.publicKey,
			name: 'Original',
		});
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(screen.getByTestId('selected')).toHaveTextContent(movedServer);
		expect(store.getState().pubky.pubkys['existing-key']).toEqual(
			expect.objectContaining({
				homeserver: movedServer,
				lastKnownHomeserver: movedServer,
				signedUp: false,
				name: 'Original',
				signupToken: '',
			}),
		);
		expect(showToast).toHaveBeenCalledWith({ type: 'info', title: 'homeservers.changedNotice' });
		expect(screen.queryByText('editPubkySheet.unableToSignIn')).toBeNull();
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(signin).toHaveBeenCalledTimes(1);
		expect(signup).not.toHaveBeenCalled();
		expect(hideSheet).not.toHaveBeenCalled();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signin).toHaveBeenLastCalledWith(
			expect.objectContaining({ homeserver: movedServer, allowRepublish: false }),
		);
		expect(hideSheet).toHaveBeenCalledTimes(1);
		expect(signup).not.toHaveBeenCalled();
	});
	it('keeps the corrected server after persistence and reopening setup', async () => {
		signin.mockResolvedValueOnce(err(new HomeserverChangedError(CUSTOM, 'Changed')));
		const store = setup({ signedUp: false, lastKnownHomeserver: defaultHomeserver.publicKey });
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		const persisted = JSON.parse(JSON.stringify(sanitizePubkySessions(store.getState().pubky)));
		await cleanupAsync();
		setup(persisted.pubkys['existing-key'], CUSTOM);
		await act(async () => {});
		expect(resolveServer).not.toHaveBeenCalled();
		expect(screen.getByTestId('selected')).toHaveTextContent(CUSTOM);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signin).toHaveBeenLastCalledWith(
			expect.objectContaining({ homeserver: CUSTOM, allowRepublish: false }),
		);
		expect(signup).not.toHaveBeenCalled();
	});
	it.each([undefined, 'invalid-key', CUSTOM])(
		'discovers an unsigned key instead of trusting an absent, invalid or different remembered server: %s',
		async lastKnownHomeserver => {
			setup({ signedUp: false, lastKnownHomeserver });
			await act(async () => {});
			expect(resolveServer).toHaveBeenCalledWith('existing-key');
			expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
			expect(screen.getByTestId('EditPubkyInviteCodeInput')).toBeTruthy();
			expect(signin).not.toHaveBeenCalled();
		},
	);
	it('keeps the selected server on failure and retries through confirmation', async () => {
		const store = setup({ signedUp: true });
		signOutRing.mockResolvedValueOnce(err('Offline'));
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		await confirmSignOut();
		expect(screen.getByText('homeservers.signOutFailed')).toBeTruthy();
		expect(screen.getByTestId('selected').props.children).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.pubkys['existing-key'].signedUp).toBe(true);
		expect(store.getState().pubky.pubkys['existing-key'].lastKnownHomeserver).toBeUndefined();
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		await confirmSignOut();
		expect(signOutRing).toHaveBeenCalledTimes(2);
		expect(store.getState().pubky.pubkys['existing-key'].signedUp).toBe(false);
		expect(store.getState().pubky.pubkys['existing-key'].lastKnownHomeserver).toBe(
			defaultHomeserver.publicKey,
		);
	});
	it('shows sign-out progress on the server control and prevents duplicate operations', async () => {
		setup({ signedUp: true });
		let finish = () => {};
		signOutRing.mockImplementationOnce(
			args =>
				new Promise(resolve => {
					finish = () => resolve(completeSignOut(args));
				}),
		);
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		act(() => {
			alert.mock.calls
				.at(-1)?.[2]
				?.find(button => button.style === 'destructive')
				?.onPress?.();
		});
		expect(screen.getByTestId('EditPubkySignOutProgress')).toBeTruthy();
		expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
		fireEvent.press(screen.getByTestId('EditPubkyRemoveServerButton'));
		expect(signOutRing).toHaveBeenCalledTimes(1);
		await act(async () => {
			finish();
		});
		expect(screen.queryByTestId('EditPubkySignOutProgress')).toBeNull();
	});
	it('shows a replacement as a pending connection without a sign-out action', () => {
		const store = setup({ signedUp: true, name: 'Original' });
		fireEvent.press(screen.getByTestId('chooseCustom'));
		expect(screen.queryByTestId('EditPubkyRemoveServerButton')).toBeNull();
		expect(screen.getByTestId('EditPubkyHomeserverLabel')).toHaveTextContent(
			'editPubkySheet.homeserverLabel',
		);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
		expect(alert).not.toHaveBeenCalled();
		expect(signOutRing).not.toHaveBeenCalled();
		expect(screen.getByTestId('selected').props.children).toBe(CUSTOM);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.pubkys['existing-key'].signedUp).toBe(true);
	});
	it('discovers an existing account before preselecting the default and offers sign-in without an invite', async () => {
		resolveServer.mockResolvedValueOnce(ok(CUSTOM));
		const store = setup({ homeserver: '', signedUp: false }, '');
		expect(screen.getByTestId('EditPubkyHomeserverLookupProgress')).toBeTruthy();
		expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
		await act(async () => {});
		expect(screen.getByTestId('selected').props.children).toBe(CUSTOM);
		expect(screen.queryByTestId('EditPubkyRemoveServerButton')).toBeNull();
		expect(screen.getByTestId('EditPubkyHomeserverLabel')).toHaveTextContent(
			'editPubkySheet.homeserverLabel',
		);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(screen.queryByTestId('EditPubkyPasteInviteButton')).toBeNull();
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(CUSTOM);
		fireEvent.press(screen.getByTestId('EditPubkySelectServerButton'));
		expect(navigation.navigate).toHaveBeenCalledWith('SelectServer', { pubky: 'existing-key' });
		expect(alert).not.toHaveBeenCalled();
		expect(signOutRing).not.toHaveBeenCalled();
		expect(signup).not.toHaveBeenCalled();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signin).toHaveBeenCalledWith(
			expect.objectContaining({ pubky: 'existing-key', homeserver: CUSTOM, allowRepublish: false }),
		);
		expect(signup).not.toHaveBeenCalled();
	});
	it('tries signup without a code, reveals a required invite, and keeps drafts unsaved on failure', async () => {
		const store = setup({ name: 'Original' });
		await act(async () => {});
		fireEvent.press(screen.getByTestId('chooseCustom'));
		expect(screen.queryByTestId('EditPubkyPasteInviteButton')).toBeNull();
		expect(screen.queryByTestId('EditPubkyScanInviteButton')).toBeNull();
		signup.mockResolvedValueOnce(err('Token required'));
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Draft');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signup).toHaveBeenCalledWith(expect.objectContaining({ pubky: 'existing-key', signupToken: '' }));
		expect(screen.getByTestId('EditPubkyInviteCodeInput').props.hasError).toBe(true);
		expect(screen.getByText('homeservers.inviteRequired')).toBeTruthy();
		expect(screen.getByTestId('EditPubkyPasteInviteButton')).toBeTruthy();
		expect(screen.getByTestId('EditPubkyScanInviteButton')).toBeTruthy();
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Original');
		fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), 'custom.code');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signup).toHaveBeenLastCalledWith(expect.objectContaining({ signupToken: 'custom.code' }));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Draft');
		expect(store.getState().pubky.pubkys['existing-key'].signupToken).toBe('');
	});
	it('saves the label with a successful connection when both fields changed', async () => {
		const store = setup({ name: 'Original', homeserver: '', signedUp: false });
		await act(async () => {});
		fireEvent.press(screen.getByTestId('chooseCustom'));
		fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), '  Renamed before connecting  ');
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(store.getState().pubky.pubkys['existing-key'].name).toBe('Renamed before connecting');
		expect(signup).toHaveBeenCalledTimes(1);
	});
	it.each([PRODUCTION_HOMESERVER, STAGING_HOMESERVER])(
		'requires an invite for a new Synonym signup on %s',
		async server => {
			setup({ homeserver: '', signedUp: false }, server);
			await act(async () => {});
			expect(screen.getByText('homeservers.inviteRequired')).toBeTruthy();
			expect(screen.getByTestId('EditPubkyInviteCodeInput').props.hasError).toBe(false);
			expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
			expect(signup).not.toHaveBeenCalled();
			fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), 'ABCD1234WXYZ');
			expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
			await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
			expect(signup).toHaveBeenCalledWith(
				expect.objectContaining({ homeserver: server, signupToken: 'ABCD-1234-WXYZ' }),
			);
		},
	);
	it('connects a new account to a custom server without assuming it needs an invite', async () => {
		setup({ homeserver: '', signedUp: false }, CUSTOM);
		await act(async () => {});
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(screen.queryByTestId('EditPubkyPasteInviteButton')).toBeNull();
		expect(screen.queryByTestId('EditPubkyScanInviteButton')).toBeNull();
		expect(screen.getByTestId('EditPubkyShowInviteButton')).toBeTruthy();
		expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signup).toHaveBeenCalledWith(expect.objectContaining({ homeserver: CUSTOM, signupToken: '' }));
		expect(signin).not.toHaveBeenCalled();
	});
	it('retries a failed lookup without assuming a new account, and keeps failed sign-in out of signup', async () => {
		resolveServer.mockResolvedValueOnce(err('Offline')).mockResolvedValueOnce(ok(PRODUCTION_HOMESERVER));
		setup({ homeserver: '', signedUp: false }, '');
		await act(async () => {});
		expect(screen.getByText('homeservers.lookupFailed')).toBeTruthy();
		expect(screen.queryByTestId('EditPubkySelectServerButton')).toBeNull();
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(screen.getByTestId('EditPubkySaveButton')).toBeDisabled();
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkyRetryLookupButton')));
		expect(screen.getByTestId('selected').props.children).toBe(PRODUCTION_HOMESERVER);
		expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signIn');
		signin.mockResolvedValueOnce(err('Offline'));
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(screen.getByText('editPubkySheet.unableToSignIn')).toBeTruthy();
		expect(screen.queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		expect(signup).not.toHaveBeenCalled();
		expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
	});
	it('preserves custom invite case, punctuation and length, and does not persist a cancelled selection', async () => {
		const store = setup({ signedUp: true });
		fireEvent.press(screen.getByTestId('chooseCustom'));
		expect(screen.queryByTestId('EditPubkyPasteInviteButton')).toBeNull();
		expect(screen.queryByTestId('EditPubkyScanInviteButton')).toBeNull();
		fireEvent.press(screen.getByTestId('EditPubkyShowInviteButton'));
		expect(screen.getByTestId('EditPubkyPasteInviteButton')).toBeTruthy();
		expect(screen.getByTestId('EditPubkyScanInviteButton')).toBeTruthy();
		expect(screen.queryByTestId('EditPubkyShowInviteButton')).toBeNull();
		const token = 'case.Sensitive/long+custom-invite';
		fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), token);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(signup).toHaveBeenCalledWith(
			expect.objectContaining({ pubky: 'existing-key', homeserver: CUSTOM, signupToken: token }),
		);
		expect(Object.keys(store.getState().pubky.pubkys)).toEqual(['existing-key']);
	});
	it('pastes a signup link into a draft without contacting a server or creating another key', async () => {
		const store = setup();
		await act(async () => {});
		clipboard.mockResolvedValue('pubkyauth://direct_signup?hs=...');
		parse.mockResolvedValue({
			data: { action: InputAction.DirectSignup, params: { homeserver: CUSTOM, inviteCode: 'opaque' } },
		});
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkyPasteInviteButton')));
		expect(screen.getByTestId('selected').props.children).toBe(CUSTOM);
		expect(screen.getByTestId('EditPubkyInviteCodeInput').props.value).toBe('opaque');
		expect(signup).not.toHaveBeenCalled();
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		expect(Object.keys(store.getState().pubky.pubkys)).toEqual(['existing-key']);
	});
	it.each([
		['form paste', 'rejected-code'],
		['form paste', 'replacement-code'],
		['scan', 'rejected-code'],
		['scan', 'replacement-code'],
		['scanner paste', 'rejected-code'],
		['scanner paste', 'replacement-code'],
	])('clears the previous rejection after %s supplies %s', async (source, code) => {
		setup(
			{},
			CUSTOM,
			<>
				<EditPubkyMain navigation={navigation as never} route={route} />
				<EditPubkyScanner navigation={navigation as never} route={{} as never} />
			</>,
		);
		await act(async () => {});
		signup.mockResolvedValueOnce(err('Token required')).mockResolvedValueOnce(err('Invalid token'));
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		fireEvent.changeText(screen.getByTestId('EditPubkyInviteCodeInput'), 'rejected-code');
		await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
		expect(screen.getByTestId('EditPubkyInviteCodeInput').props.hasError).toBe(true);
		expect(screen.getByText('signup.invalidDescription')).toBeTruthy();
		parse.mockResolvedValueOnce({ data: { action: InputAction.Invite, params: { inviteCode: code } } });
		if (source !== 'scan') clipboard.mockResolvedValueOnce(code);
		await act(async () => {
			if (source === 'form paste') fireEvent.press(screen.getByTestId('EditPubkyPasteInviteButton'));
			else if (source === 'scan') await mockScannerProps.onScan(code);
			else await mockScannerProps.onCopyClipboard();
		});
		expect(screen.getByTestId('EditPubkyInviteCodeInput').props.value).toBe(code);
		expect(screen.getByTestId('EditPubkyInviteCodeInput').props.hasError).toBe(false);
		expect(screen.queryByText('signup.invalidDescription')).toBeNull();
		expect(screen.getByText('homeservers.inviteRequired')).toBeTruthy();
		expect(screen.getByTestId('EditPubkySaveButton')).not.toBeDisabled();
		expect(signup).toHaveBeenCalledTimes(2);
	});
	it('scans a signup link into the same draft and refuses auth requests', async () => {
		setup(
			{},
			defaultHomeserver.publicKey,
			<EditPubkyScanner navigation={navigation as never} route={{} as never} />,
		);
		parse.mockResolvedValueOnce({ data: { action: InputAction.Signup, params: { homeserver: CUSTOM } } });
		await act(async () => mockScannerProps.onScan('auth-link'));
		expect(showToast).toHaveBeenCalledWith(
			expect.objectContaining({ description: 'homeservers.inputError.authorization' }),
		);
		expect(navigation.goBack).not.toHaveBeenCalled();
		expect(navigation.popToTop).not.toHaveBeenCalled();
		parse.mockResolvedValueOnce({
			data: { action: InputAction.DirectSignup, params: { homeserver: CUSTOM, inviteCode: '' } },
		});
		await act(async () => mockScannerProps.onScan('signup-link'));
		expect(screen.getByTestId('selected').props.children).toBe(CUSTOM);
		expect(navigation.popToTop).toHaveBeenCalledTimes(1);
		expect(signup).not.toHaveBeenCalled();
	});
	it.each([
		['scan', false],
		['scan', true],
		['paste', false],
		['paste', true],
	])(
		'reviews an unsaved server from a %s link before signing up (configured=%s)',
		async (source, signedUp) => {
			const homeserver = 'n'.repeat(51) + 'y';
			const inviteCode = 'case.Sensitive+invite';
			const link = `pubkyauth://direct_signup?hs=${homeserver}&st=${encodeURIComponent(inviteCode)}`;
			const store = setup(
				{ signedUp: Boolean(signedUp), homeserver: CUSTOM, name: 'Original' },
				CUSTOM,
				<>
					<View testID="setupReview">
						<EditPubkyMain navigation={navigation as never} route={route} />
					</View>
					<EditPubkySelectServer navigation={navigation as never} route={route} />
					<EditPubkyScanner navigation={navigation as never} route={{} as never} />
				</>,
			);
			await act(async () => {});
			fireEvent.changeText(screen.getByTestId('EditPubkyNameInput'), 'Draft name');
			expect(screen.queryByTestId('EditPubkyScanInviteButton')).toBeNull();
			expect(screen.getByTestId('SelectServerScanButton')).toBeTruthy();
			expect(screen.getByTestId('SelectServerPasteButton')).toBeTruthy();
			const before = store.getState();
			parse.mockResolvedValueOnce({
				data: { action: InputAction.DirectSignup, params: { homeserver, inviteCode } },
			});
			if (source === 'scan') {
				fireEvent.press(screen.getByTestId('SelectServerScanButton'));
				expect(navigation.navigate).toHaveBeenCalledWith('Scanner');
				await act(async () => mockScannerProps.onScan(link));
			} else {
				clipboard.mockResolvedValueOnce(link);
				await act(async () => fireEvent.press(screen.getByTestId('SelectServerPasteButton')));
			}
			expect(parse).toHaveBeenCalledWith(link, source === 'scan' ? 'scan' : 'clipboard');
			expect(screen.getByTestId('selected')).toHaveTextContent(homeserver);
			expect(
				within(screen.getByTestId('setupReview')).getByText(
					`${homeserver.slice(0, 6)}…${homeserver.slice(-4)}`,
				),
			).toBeTruthy();
			expect(screen.getByTestId('EditPubkyInviteCodeInput').props.value).toBe(inviteCode);
			expect(screen.getByTestId('EditPubkyNameInput').props.value).toBe('Draft name');
			expect(screen.getByTestId('EditPubkySaveButton')).toHaveTextContent('homeservers.signUp');
			expect(navigation.popToTop).toHaveBeenCalledTimes(1);
			expect(store.getState()).toEqual(before);
			expect(signup).not.toHaveBeenCalled();
			expect(signin).not.toHaveBeenCalled();
			expect(openHomeserverSettings).not.toHaveBeenCalled();
			await act(async () => fireEvent.press(screen.getByTestId('EditPubkySaveButton')));
			expect(signup).toHaveBeenCalledWith(
				expect.objectContaining({ pubky: 'existing-key', homeserver, signupToken: inviteCode }),
			);
			expect(store.getState().pubky.pubkys['existing-key']).toEqual(
				expect.objectContaining({ name: 'Draft name', homeserver, signupToken: '' }),
			);
			expect(store.getState().pubky.homeservers).toEqual(before.pubky.homeservers);
			expect(Object.keys(store.getState().pubky.pubkys)).toEqual(['existing-key']);
		},
	);
	it.each([
		['empty', 'errors.emptyClipboard'],
		['authorization', 'homeservers.inputError.authorization'],
		['invalid', 'homeservers.inputError.invalid'],
		['unreadable', 'scanInvite.failedToReadClipboard'],
	])('keeps the picker unchanged after an %s clipboard input', async (input, description) => {
		const store = setup(
			{ signedUp: true },
			defaultHomeserver.publicKey,
			<EditPubkySelectServer navigation={navigation as never} route={route} />,
		);
		const before = store.getState();
		if (input === 'unreadable') clipboard.mockRejectedValueOnce(new Error('Clipboard unavailable'));
		else clipboard.mockResolvedValueOnce(input === 'empty' ? '' : 'link');
		if (input === 'authorization' || input === 'invalid') {
			parse.mockResolvedValueOnce({
				data: {
					action: input === 'authorization' ? InputAction.Auth : InputAction.DirectSignup,
					params: { homeserver: 'invalid' },
				},
			});
		}
		await act(async () => fireEvent.press(screen.getByTestId('SelectServerPasteButton')));
		expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', description }));
		expect(screen.getByTestId('selected')).toHaveTextContent(defaultHomeserver.publicKey);
		expect(store.getState()).toEqual(before);
		expect(screen.getByTestId('SelectServerPasteButton')).not.toBeDisabled();
		expect(navigation.popToTop).not.toHaveBeenCalled();
		expect(signup).not.toHaveBeenCalled();
	});
	it('adds a server in Settings without changing the edited key or its draft', () => {
		const store = setup(
			{},
			defaultHomeserver.publicKey,
			<HomeserverFormScreen navigation={navigation as never} route={{} as never} />,
		);
		fireEvent.changeText(screen.getByTestId('AddServerLabelInput'), 'Personal');
		fireEvent.changeText(screen.getByTestId('AddServerHomeserverInput'), `pubky://${CUSTOM}`);
		fireEvent.press(screen.getByTestId('AddServerSaveButton'));
		expect(screen.getByTestId('selected').props.children).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.homeservers[CUSTOM].name).toBe('Personal');
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(defaultHomeserver.publicKey);
		expect(navigation.goBack).toHaveBeenCalled();
	});
	it('hands off the picker to Settings management without saving the key', () => {
		setup(
			{},
			defaultHomeserver.publicKey,
			<EditPubkySelectServer navigation={navigation as never} route={route} />,
		);
		fireEvent.press(screen.getByTestId('SelectServerManageButton'));
		expect(openHomeserverSettings).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId('selected').props.children).toBe(defaultHomeserver.publicKey);
		expect(navigation.goBack).not.toHaveBeenCalled();
		expect(screen.queryByText('homeservers.rename')).toBeNull();
		expect(screen.queryByText('homeservers.remove')).toBeNull();
	});
});

describe('homeserver management UI', () => {
	it('dismisses the keyboard by tapping a label without saving or leaving the form', () => {
		const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
		const store = setup(
			{},
			defaultHomeserver.publicKey,
			<HomeserverFormScreen navigation={navigation as never} route={{} as never} />,
		);
		const previousState = store.getState();
		fireEvent.press(screen.getByText('addServer.homeserverLabel'));
		expect(dismiss).toHaveBeenCalledTimes(1);
		expect(store.getState()).toEqual(previousState);
		expect(navigation.goBack).not.toHaveBeenCalled();
		dismiss.mockRestore();
	});
	it('protects active servers and keeps default changes out of the list', () => {
		const store = setup(
			{ homeserver: CUSTOM, signedUp: true },
			CUSTOM,
			<HomeserversScreen navigation={navigation as never} route={{} as never} />,
		);
		act(() => {
			store.dispatch(addHomeserver({ name: 'Personal', publicKey: CUSTOM }));
		});
		expect(screen.getByTestId(`HomeserverRemove-${CUSTOM}`)).toBeDisabled();
		expect(screen.queryByTestId(`HomeserverRemove-${defaultHomeserver.publicKey}`)).toBeNull();
		expect(screen.queryByTestId(`HomeserverDefault-${CUSTOM}`)).toBeNull();
		expect(screen.getByTestId(`HomeserverRename-${defaultHomeserver.publicKey}`)).toBeTruthy();
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(CUSTOM);
		fireEvent.press(screen.getByTestId(`HomeserverRename-${CUSTOM}`));
		expect(navigation.navigate).toHaveBeenCalledWith('HomeserverForm', {
			server: { name: 'Personal', publicKey: CUSTOM },
		});
	});
	it('saves the default checkbox and shared label together without moving existing keys', () => {
		const store = setup(
			{ homeserver: CUSTOM },
			CUSTOM,
			<HomeserverFormScreen
				navigation={navigation as never}
				route={{ params: { server: { name: 'Old', publicKey: CUSTOM } } } as never}
			/>,
		);
		expect(screen.getByTestId('EditServerHomeserverInput').props.editable).toBe(false);
		fireEvent.changeText(screen.getByTestId('EditServerLabelInput'), 'Renamed');
		fireEvent.press(screen.getByTestId('EditServerDefaultCheckbox'));
		expect(store.getState().pubky.preferredHomeserver).toBe(defaultHomeserver.publicKey);
		fireEvent.press(screen.getByTestId('EditServerSaveButton'));
		expect(store.getState().pubky.homeservers[CUSTOM]).toEqual({ name: 'Renamed', publicKey: CUSTOM });
		expect(store.getState().pubky.preferredHomeserver).toBe(CUSTOM);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(CUSTOM);
	});
	it('does not change the default when checkbox edits are cancelled', () => {
		const store = setup(
			{ homeserver: CUSTOM },
			CUSTOM,
			<HomeserverFormScreen
				navigation={navigation as never}
				route={{ params: { server: { name: 'Personal', publicKey: CUSTOM } } } as never}
			/>,
		);
		fireEvent.press(screen.getByTestId('EditServerDefaultCheckbox'));
		fireEvent.press(screen.getByTestId('EditServerCancelButton'));
		expect(store.getState().pubky.preferredHomeserver).toBe(defaultHomeserver.publicKey);
	});
	it('falls back to the built-in server when unchecking the current custom default', () => {
		const store = setup(
			{ homeserver: CUSTOM },
			CUSTOM,
			<HomeserverFormScreen
				navigation={navigation as never}
				route={{ params: { server: { name: 'Personal', publicKey: CUSTOM } } } as never}
			/>,
			CUSTOM,
		);
		expect(screen.getByTestId('EditServerDefaultCheckbox').props.accessibilityState.checked).toBe(true);
		fireEvent.press(screen.getByTestId('EditServerDefaultCheckbox'));
		fireEvent.press(screen.getByTestId('EditServerSaveButton'));
		expect(store.getState().pubky.preferredHomeserver).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(CUSTOM);
	});
	it('can restore the built-in default through edit while its fields stay read-only', () => {
		const store = setup(
			{ homeserver: CUSTOM },
			CUSTOM,
			<HomeserverFormScreen
				navigation={navigation as never}
				route={{ params: { server: defaultHomeserver } } as never}
			/>,
			CUSTOM,
		);
		expect(screen.getByTestId('EditServerLabelInput').props.editable).toBe(false);
		expect(screen.getByTestId('EditServerHomeserverInput').props.editable).toBe(false);
		fireEvent.press(screen.getByTestId('EditServerDefaultCheckbox'));
		fireEvent.press(screen.getByTestId('EditServerSaveButton'));
		expect(store.getState().pubky.preferredHomeserver).toBe(defaultHomeserver.publicKey);
		expect(store.getState().pubky.pubkys['existing-key'].homeserver).toBe(CUSTOM);
	});
});
