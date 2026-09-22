import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ok, err } from '@synonymdev/result';
import { showToast } from '@synonymdev/react-native-toast';
import ReuseSharedPubkySheet from '../src/sheets/ReuseSharedPubkySheet';
import { hideSheet } from '../src/sheets/sheetNavigation';
import { connectSharedPubky } from '../src/utils/pubky';
import type { SharedPubkyIdentity } from '../src/utils/sharedPubky';

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string, options?: { number?: number }) => `${key}:${options?.number}` },
}));

jest.mock('react-redux', () => ({
	__esModule: true,
	useDispatch: () => jest.fn(),
}));

jest.mock('../src/components/Sheet.tsx', () => {
	const ReactMock = require('react');
	const { Text, View } = require('react-native');

	return {
		__esModule: true,
		default: ({ id, title, children }: { id: string; title: string; children?: React.ReactNode }) =>
			ReactMock.createElement(
				View,
				null,
				ReactMock.createElement(Text, { testID: `${id}-title` }, title),
				children,
			),
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
			loading,
		}: {
			onPress?: () => void;
			testID?: string;
			text: string;
			loading?: boolean;
		}) =>
			ReactMock.createElement(
				Pressable,
				{ onPress: loading ? undefined : onPress, testID, loading },
				ReactMock.createElement(Text, null, text),
			),
	};
});

jest.mock('../src/components/Card.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ children }: { children?: React.ReactNode }) => ReactMock.createElement(View, null, children),
	};
});

jest.mock('../src/components/ProfileAvatar', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ image }: { image?: string }) =>
			ReactMock.createElement(View, { testID: 'ProfileAvatar', image }),
	};
});

// styled-components typography needs a ThemeProvider; plain Text keeps the copy assertable.
jest.mock('../src/theme/typography', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');
	const asText =
		() =>
		({ children, testID }: { children?: React.ReactNode; testID?: string }) =>
			ReactMock.createElement(Text, { testID }, children);

	return { __esModule: true, Text2Xl: asText(), Text5Xl: asText(), TextBaseB: asText(), TextBaseM: asText() };
});

// The real module reaches the store and the native layer.
jest.mock('../src/utils/pubky.ts', () => ({ __esModule: true, connectSharedPubky: jest.fn() }));

jest.mock('../src/utils/clipboard', () => ({ __esModule: true, copyToClipboard: jest.fn() }));

jest.mock('@synonymdev/react-native-toast', () => ({ __esModule: true, showToast: jest.fn() }));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ __esModule: true, hideSheet: jest.fn() }));

const connectSharedPubkyMock = connectSharedPubky as jest.MockedFunction<typeof connectSharedPubky>;
const hideSheetMock = hideSheet as jest.MockedFunction<typeof hideSheet>;
const showToastMock = showToast as jest.MockedFunction<typeof showToast>;

const PUBKY = 'ona4yr48wsbpr3ue9d4qj41ge1kcc6r7fdiy6o3ugjrrhi4y72rda';

const identity = (overrides: Partial<SharedPubkyIdentity> = {}): SharedPubkyIdentity => ({
	version: 1,
	sourceApp: 'to.bitkit',
	pubky: PUBKY,
	...overrides,
});

const renderSheet = (params: { identity: SharedPubkyIdentity; index: number }): void => {
	render(<ReuseSharedPubkySheet route={{ params } as never} navigation={{} as never} />);
};

const pressConnect = async (): Promise<void> => {
	await act(async () => {
		fireEvent.press(screen.getByTestId('ReuseSharedPubkyConnectButton'));
	});
};

describe('ReuseSharedPubkySheet', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		connectSharedPubkyMock.mockResolvedValue(ok(PUBKY));
	});

	it('presents the single identity it was opened with', () => {
		renderSheet({ identity: identity(), index: 1 });

		expect(screen.getByTestId('reuse-shared-pubky-title')).toHaveTextContent('reuseSharedPubky.title');
		expect(screen.getByText(PUBKY)).toBeTruthy();
		// No name of its own, so it is named after its position in the home list.
		expect(screen.getByText('reuseSharedPubky.fallbackName:2')).toBeTruthy();
		expect(screen.getByTestId('ReuseSharedPubkyConnectButton')).toHaveTextContent(
			'reuseSharedPubky.useInRing',
		);
	});

	it('shows the name the source app shared instead of the fallback', () => {
		renderSheet({ identity: identity({ name: 'Satoshi', image: 'data:image/png;base64,abc' }), index: 1 });

		expect(screen.getByText('Satoshi')).toBeTruthy();
		expect(screen.queryByText('reuseSharedPubky.fallbackName:2')).toBeNull();
		expect(screen.getByTestId('ProfileAvatar').props.image).toBe('data:image/png;base64,abc');
	});

	it('closes itself once the identity is connected', async () => {
		renderSheet({ identity: identity(), index: 0 });

		await pressConnect();

		expect(connectSharedPubkyMock).toHaveBeenCalledWith(expect.objectContaining({ identity: identity() }));
		expect(hideSheetMock).toHaveBeenCalledWith('reuse-shared-pubky');
		expect(showToastMock).not.toHaveBeenCalled();
	});

	it('stays open and reports why when connecting fails', async () => {
		connectSharedPubkyMock.mockResolvedValue(err('Bitkit refused the credential'));

		renderSheet({ identity: identity(), index: 0 });
		await pressConnect();

		expect(hideSheetMock).not.toHaveBeenCalled();
		expect(showToastMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', description: 'Bitkit refused the credential' }),
		);
		// The call to action is usable again, so the same identity can be retried.
		expect(screen.getByTestId('ReuseSharedPubkyConnectButton').props.loading).toBe(false);

		await pressConnect();
		expect(connectSharedPubkyMock).toHaveBeenCalledTimes(2);
	});

	it('stays open when the native bridge throws', async () => {
		connectSharedPubkyMock.mockRejectedValue(new Error('bridge unavailable'));

		renderSheet({ identity: identity(), index: 0 });
		await pressConnect();

		expect(hideSheetMock).not.toHaveBeenCalled();
		expect(showToastMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', description: 'bridge unavailable' }),
		);
		expect(screen.getByTestId('ReuseSharedPubkyConnectButton').props.loading).toBe(false);
		connectSharedPubkyMock.mockResolvedValueOnce(ok(PUBKY));
		await pressConnect();
		expect(hideSheetMock).toHaveBeenCalledWith('reuse-shared-pubky');
	});
});
