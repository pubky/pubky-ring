import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { err, ok } from '@synonymdev/result';
import EditPubkySheet from '../src/sheets/EditPubkySheet';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver } from '../src/utils/pubky';
import { getPubky } from '../src/store/selectors/pubkySelectors';
import { hideSheet } from '../src/sheets/sheetNavigation';
import { DEFAULT_HOMESERVER } from '../src/utils/constants';
import type { Pubky } from '../src/types/pubky';

const mockDispatch = jest.fn();

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ children }: { children?: React.ReactNode }) => ReactMock.createElement(View, null, children),
	};
});

jest.mock('../src/components/Button.tsx', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');

	return {
		__esModule: true,
		default: ({
			onPress,
			testID,
			text,
			disabled,
		}: {
			onPress: () => void;
			testID?: string;
			text: string;
			disabled?: boolean;
		}) =>
			ReactMock.createElement(
				Pressable,
				{ onPress: disabled ? undefined : onPress, testID, disabled },
				ReactMock.createElement(Text, null, text),
			),
	};
});

jest.mock('../src/components/TextField.tsx', () => {
	const ReactMock = require('react');
	const { Text, TextInput, View } = require('react-native');

	return {
		__esModule: true,
		default: ReactMock.forwardRef(
			(
				{ helperText, error, testID, ...props }: { helperText?: string; error?: string; testID?: string },
				ref: unknown,
			) =>
				ReactMock.createElement(
					View,
					null,
					ReactMock.createElement(TextInput, { ...props, testID, ref }),
					helperText ? ReactMock.createElement(Text, { testID: `${testID}-HelperText` }, helperText) : null,
					error ? ReactMock.createElement(Text, { testID: `${testID}-Error` }, error) : null,
				),
		),
	};
});

jest.mock('../src/theme/typography', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');
	const asText =
		() =>
		({ children, testID }: { children?: React.ReactNode; testID?: string }) =>
			ReactMock.createElement(Text, { testID }, children);

	return { __esModule: true, TextSmM: asText(), TextXsM: asText() };
});

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => mockDispatch,
	useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({
	__esModule: true,
	getPubky: jest.fn(),
}));

jest.mock('../src/store/slices/pubkysSlice.ts', () => ({
	__esModule: true,
	setPubkyData: (payload: unknown) => ({ type: 'pubky/setPubkyData', payload }),
}));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({
	__esModule: true,
	hideSheet: jest.fn(),
}));

jest.mock('../src/utils/pubky.ts', () => ({
	__esModule: true,
	getPubkySecretKey: jest.fn(),
	signInToHomeserver: jest.fn(),
	signUpToHomeserver: jest.fn(),
	truncatePubky: (pubky: string) => pubky,
}));

jest.mock('../src/utils/helpers.ts', () => ({
	__esModule: true,
	formatSignupToken: (text: string) => text,
}));

jest.mock('../src/utils/signupErrors.ts', () => ({
	__esModule: true,
	getSignupTokenErrorDescription: () => undefined,
}));

const PUBKY = 'pubky-under-edit';

const getPubkyMock = getPubky as unknown as jest.Mock;
const getPubkySecretKeyMock = getPubkySecretKey as jest.MockedFunction<typeof getPubkySecretKey>;
const signInMock = signInToHomeserver as jest.MockedFunction<typeof signInToHomeserver>;
const signUpMock = signUpToHomeserver as jest.MockedFunction<typeof signUpToHomeserver>;
const hideSheetMock = hideSheet as jest.MockedFunction<typeof hideSheet>;

const storedPubky = (overrides: Partial<Pubky> = {}): Pubky =>
	({
		name: 'Stored name',
		homeserver: DEFAULT_HOMESERVER,
		signedUp: true,
		signupToken: '',
		image: '',
		sessions: [],
		sourceApp: 'app.pubkyring',
		...overrides,
	}) as Pubky;

const renderSheet = (): ReturnType<typeof render> =>
	render(<EditPubkySheet route={{ params: { pubky: PUBKY } } as never} navigation={{} as never} />);

const pressSave = async (getByTestId: ReturnType<typeof render>['getByTestId']): Promise<void> => {
	await act(async () => {
		fireEvent.press(getByTestId('EditPubkySaveButton'));
	});
};

describe('EditPubkySheet', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		getPubkyMock.mockReturnValue(storedPubky());
		getPubkySecretKeyMock.mockResolvedValue(ok({ secretKey: 'secret', mnemonic: '' }));
		signInMock.mockResolvedValue(ok({ pubky: PUBKY, capabilities: [], session_id: 'session' } as never));
		signUpMock.mockResolvedValue(ok({ pubky: PUBKY, capabilities: [], session_id: 'session' } as never));
	});

	it('renames without ever fetching the secret key', async () => {
		const { getByTestId } = renderSheet();

		fireEvent.changeText(getByTestId('EditPubkyNameInput'), 'Renamed');
		await pressSave(getByTestId);

		expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
		expect(signInMock).not.toHaveBeenCalled();
		expect(signUpMock).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'pubky/setPubkyData',
			payload: {
				pubky: PUBKY,
				data: { name: 'Renamed', homeserver: DEFAULT_HOMESERVER, signupToken: '' },
			},
		});
		expect(hideSheetMock).toHaveBeenCalledWith('edit-pubky');
	});

	it('renames a borrowed pubky without asking the source app for its key', async () => {
		getPubkyMock.mockReturnValue(storedPubky({ sourceApp: 'to.bitkit' }));
		const { getByTestId } = renderSheet();

		fireEvent.changeText(getByTestId('EditPubkyNameInput'), 'Bitkit pubky');
		await pressSave(getByTestId);

		expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
		expect(hideSheetMock).toHaveBeenCalledWith('edit-pubky');
	});

	it('surfaces a secret key failure instead of closing the sheet', async () => {
		getPubkySecretKeyMock.mockResolvedValue(err('no longer shared'));
		const { getByTestId, getByText } = renderSheet();

		fireEvent.changeText(getByTestId('EditPubkyNameInput'), 'Renamed');
		fireEvent.changeText(getByTestId('EditPubkyHomeserverInput'), 'another-homeserver');
		await pressSave(getByTestId);

		expect(getPubkySecretKeyMock).toHaveBeenCalledWith(PUBKY);
		expect(getByText('no longer shared')).toBeTruthy();
		expect(hideSheetMock).not.toHaveBeenCalled();
		// The rename is still applied, as before.
		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'pubky/setPubkyData',
			payload: { pubky: PUBKY, data: { ...storedPubky(), name: 'Renamed' } },
		});
	});

	it('signs a borrowed pubky in without attempting sign-up', async () => {
		getPubkyMock.mockReturnValue(storedPubky({ sourceApp: 'to.bitkit', signedUp: false }));
		const { getByTestId } = renderSheet();

		await pressSave(getByTestId);

		expect(getPubkySecretKeyMock).toHaveBeenCalledWith(PUBKY);
		expect(signUpMock).not.toHaveBeenCalled();
		expect(signInMock).toHaveBeenCalledWith(expect.objectContaining({ pubky: PUBKY, secretKey: 'secret' }));
		expect(hideSheetMock).toHaveBeenCalledWith('edit-pubky');
	});

	it('still signs an owned pubky up when it is not signed up yet', async () => {
		getPubkyMock.mockReturnValue(storedPubky({ signedUp: false }));
		const { getByTestId } = renderSheet();

		await pressSave(getByTestId);

		expect(signUpMock).toHaveBeenCalledWith(expect.objectContaining({ pubky: PUBKY, secretKey: 'secret' }));
		expect(signInMock).toHaveBeenCalled();
		expect(hideSheetMock).toHaveBeenCalledWith('edit-pubky');
	});

	it('locks the homeserver and hides the invite code for a borrowed pubky', () => {
		getPubkyMock.mockReturnValue(storedPubky({ sourceApp: 'to.bitkit', signedUp: false }));
		const { getByTestId, queryByTestId } = renderSheet();

		expect(getByTestId('EditPubkyHomeserverInput').props.editable).toBe(false);
		expect(getByTestId('EditPubkyHomeserverInput-HelperText')).toBeTruthy();
		expect(queryByTestId('EditPubkyInviteCodeInput')).toBeNull();
		// The name stays editable.
		expect(getByTestId('EditPubkyNameInput').props.editable).not.toBe(false);
	});

	it('keeps the homeserver editable and the invite code visible for an owned pubky', () => {
		getPubkyMock.mockReturnValue(storedPubky({ signedUp: false }));
		const { getByTestId, queryByTestId } = renderSheet();

		expect(getByTestId('EditPubkyHomeserverInput').props.editable).toBe(true);
		expect(queryByTestId('EditPubkyHomeserverInput-HelperText')).toBeNull();
		expect(getByTestId('EditPubkyInviteCodeInput')).toBeTruthy();
	});

	it('does not substitute a default homeserver for a borrowed pubky without one', async () => {
		getPubkyMock.mockReturnValue(storedPubky({ sourceApp: 'to.bitkit', homeserver: '' }));
		const { getByTestId } = renderSheet();

		expect(getByTestId('EditPubkyHomeserverInput').props.value).toBe('');

		fireEvent.changeText(getByTestId('EditPubkyNameInput'), 'Renamed');
		await pressSave(getByTestId);

		expect(getPubkySecretKeyMock).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith({
			type: 'pubky/setPubkyData',
			payload: { pubky: PUBKY, data: { name: 'Renamed', homeserver: '', signupToken: '' } },
		});
	});
});
