import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';
import SharedPubkyCard from '../src/components/SharedPubkyCard';
import Button from '../src/components/Button';
import { showSheet } from '../src/sheets/sheetNavigation';
import type { SharedPubkyIdentity } from '../src/utils/sharedPubky';

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string, options?: { number?: number }) => `${key}:${options?.number}` },
}));

jest.mock('../src/components/Card.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
			ReactMock.createElement(View, { style }, children),
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
			dashed,
		}: {
			onPress?: () => void;
			testID?: string;
			text: string;
			dashed?: boolean;
		}) =>
			ReactMock.createElement(
				Pressable,
				{ onPress, testID, dashed },
				ReactMock.createElement(Text, null, text),
			),
	};
});

jest.mock('../src/components/ProfileAvatar.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: (props: { name?: string; pubky: string; size?: number; image?: string }) =>
			ReactMock.createElement(View, { testID: 'ProfileAvatar', ...props }),
	};
});

// The real module reaches the store and the native layer; only the truncation matters here.
jest.mock('../src/utils/pubky.ts', () => ({
	__esModule: true,
	truncateStr: (str: string, displayLength: number = 5) =>
		str.length <= displayLength * 2
			? str
			: `${str.substring(0, displayLength)}...${str.substring(str.length - displayLength)}`,
}));

jest.mock('../src/hooks/usePubkyHandlers', () => ({
	__esModule: true,
	usePubkyHandlers: () => ({ onPubkyPress: jest.fn() }),
}));

jest.mock('../src/utils/sheetHelpers.ts', () => ({ __esModule: true, showBackupSheet: jest.fn() }));

// styled-components typography needs a ThemeProvider; plain Text keeps the copy assertable.
jest.mock('../src/theme/typography', () => {
	const ReactMock = require('react');
	const { Text } = require('react-native');
	const asText =
		() =>
		({ children, testID }: { children?: React.ReactNode; testID?: string }) =>
			ReactMock.createElement(Text, { testID }, children);

	return { __esModule: true, Text2Xl: asText(), TextBaseB: asText(), TextXsSb: asText() };
});

jest.mock('../src/icons/index.ts', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');
	const asIcon = () => (): React.ReactElement => ReactMock.createElement(View, null);

	return { __esModule: true, ChevronRight: asIcon(), Plus: asIcon(), Scan: asIcon() };
});

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ __esModule: true, showSheet: jest.fn() }));

const showSheetMock = showSheet as jest.MockedFunction<typeof showSheet>;

const PUBKY = 'ona4yr48wsbpr3ue9d4qj41ge1kcc6r7fdiy6o3ugjrrhi4y72rda';

const identity = (overrides: Partial<SharedPubkyIdentity> = {}): SharedPubkyIdentity => ({
	version: 1,
	sourceApp: 'to.bitkit',
	pubky: PUBKY,
	...overrides,
});

describe('SharedPubkyCard', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows the truncated key and the Bitkit badge under a positional fallback name', () => {
		render(<SharedPubkyCard identity={identity()} index={1} />);

		expect(screen.getByTestId('SharedPubkyCard--1')).toBeTruthy();
		expect(screen.getByTestId('BitkitBadge')).toBeTruthy();
		expect(screen.getByText('reuseSharedPubky.fallbackName:2')).toBeTruthy();
		expect(screen.getByText('ona4y...72rda')).toBeTruthy();
		// A borrowed key is never backed up by Ring, so the reminder must not appear.
		expect(screen.queryByTestId('PubkyBox-BackupButton')).toBeNull();
	});

	it('prefers the name the source app shared', () => {
		render(<SharedPubkyCard identity={identity({ name: 'Satoshi' })} index={0} />);

		expect(screen.getByText('Satoshi')).toBeTruthy();
		expect(screen.queryByText('reuseSharedPubky.fallbackName:1')).toBeNull();
	});

	it('opens the same sheet from the card body and from the button', () => {
		render(<SharedPubkyCard identity={identity()} index={2} />);

		fireEvent.press(screen.getByTestId('SharedPubkyCard--2-Content'));
		fireEvent.press(screen.getByTestId('SharedPubkyCard--2-ActionButton'));

		expect(showSheetMock).toHaveBeenCalledTimes(2);
		showSheetMock.mock.calls.forEach(call => {
			expect(call).toEqual(['reuse-shared-pubky', { identity: identity(), index: 2 }]);
		});
	});

	it('marks the call to action as not yet adopted', () => {
		render(<SharedPubkyCard identity={identity()} index={0} />);

		const button = screen.getByTestId('SharedPubkyCard--0-ActionButton');
		expect(button.props.dashed).toBe(true);
		expect(button).toHaveTextContent('reuseSharedPubky.useInRing');
	});

	it('preserves the shared avatar inputs and dashed native sibling tree without long presses', () => {
		render(
			<SharedPubkyCard
				identity={identity({ pubky: `pk:${PUBKY}`, name: 'Alice & Bob', image: 'shared-avatar.jpg' })}
				index={4}
			/>,
		);
		const testID = 'SharedPubkyCard-AliceBob-4';
		expect(screen.getByTestId('ProfileAvatar').props).toMatchObject({
			pubky: PUBKY,
			name: 'Alice & Bob',
			size: 48,
			image: 'shared-avatar.jpg',
		});
		expect(screen.getByText('Alice & Bob')).toBeTruthy();
		const outer = screen.toJSON() as ReactTestRendererJSON;
		const card = outer.children?.[0] as ReactTestRendererJSON;
		const [body, content, action] = card.children as ReactTestRendererJSON[];
		expect(outer.props.testID).toBe(testID);
		expect(outer.children).toHaveLength(1);
		expect(card.children).toHaveLength(3);
		expect(StyleSheet.flatten(card.props.style)).toMatchObject({ borderWidth: 1, borderStyle: 'dashed' });
		expect(body.props.testID).toBe(`${testID}-Content`);
		expect(StyleSheet.flatten(body.props.style)).toMatchObject({
			position: 'absolute',
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		});
		expect(content.props.pointerEvents).toBe('box-none');
		expect(action.props.testID).toBe(`${testID}-ActionButton`);
		expect(screen.UNSAFE_getByType(TouchableOpacity).props.onLongPress).toBeUndefined();
		expect(screen.UNSAFE_getByType(Button).props.onLongPress).toBeUndefined();
	});
});
