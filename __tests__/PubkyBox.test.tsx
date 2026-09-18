import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactTestRendererJSON } from 'react-test-renderer';
import { ThemeProvider } from 'styled-components/native';
import PubkyBox from '../src/components/PubkyBox';
import SharedPubkyCard from '../src/components/SharedPubkyCard';
import { darkTheme } from '../src/theme';
import { defaultPubkyState } from '../src/store/shapes/pubky';
import { EBackupPreference } from '../src/types/pubky';
import { showSheet } from '../src/sheets/sheetNavigation';
import { showBackupSheet } from '../src/utils/sheetHelpers';

const mockOnPubkyPress = jest.fn();

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: {
		t: (key: string, options?: { number?: number }) => (options ? `${key}:${options.number}` : key),
	},
}));
jest.mock('../src/hooks/usePubkyHandlers', () => ({
	usePubkyHandlers: () => ({ onPubkyPress: mockOnPubkyPress }),
}));
jest.mock('../src/utils/sheetHelpers.ts', () => ({ showBackupSheet: jest.fn() }));
jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ showSheet: jest.fn() }));
jest.mock('../src/utils/pubky.ts', () => ({
	truncateStr: (str: string, length = 5) =>
		str.length <= length * 2 ? str : `${str.slice(0, length)}...${str.slice(-length)}`,
}));
jest.mock('react-redux', () => ({ useSelector: () => 'stored-avatar.jpg' }));
jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({ getPubkyImage: jest.fn() }));
jest.mock('react-native-facehash', () => ({ Facehash: () => null }));
jest.mock('../src/theme/typography', () => {
	const { Text } = require('react-native');
	return { Text2Xl: Text, TextBaseB: Text, TextXsSb: Text, TextSmB: Text, TextXsB: Text };
});
jest.mock('../src/theme/components.ts', () => {
	const { ActivityIndicator } = require('react-native');
	return { ActivityIndicator };
});
jest.mock('../src/icons/index.ts', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');
	return {
		ChevronRight: () => ReactMock.createElement(View, { testID: 'Chevron' }),
		Scan: () => ReactMock.createElement(View, { testID: 'Scan' }),
		Plus: () => ReactMock.createElement(View, { testID: 'Plus' }),
	};
});

const PUBKY = 'ona4yr48wsbpr3ue9d4qj41ge1kcc6r7fdiy6o3ugjrrhi4y72rda';
const KEY = `pk:${PUBKY}`;
const CARD_ID = 'PubkyBox-SatoshiNakamoto-2';
const defaultProps = {
	pubky: KEY,
	pubkyData: { ...defaultPubkyState, name: 'Satoshi Nakamoto!', signedUp: true },
	index: 2,
};

const card = (props: Partial<React.ComponentProps<typeof PubkyBox>> = {}): React.ReactElement => (
	<ThemeProvider theme={darkTheme}>
		<PubkyBox {...defaultProps} {...props} />
	</ThemeProvider>
);

describe('PubkyBox', () => {
	beforeEach(() => jest.clearAllMocks());

	it('opens profile details from the body and the scanner from the action', () => {
		render(card());
		fireEvent.press(screen.getByTestId(`${CARD_ID}-Content`));
		fireEvent.press(screen.getByTestId(`${CARD_ID}-ActionButton`));
		expect(mockOnPubkyPress).toHaveBeenCalledWith(KEY, 2);
		expect(showSheet).toHaveBeenCalledWith('auth', { screen: 'Scanner', params: { pubky: KEY } });
		expect(screen.getByTestId('Scan')).toBeTruthy();
		expect(screen.getByText('auth.authorize')).toBeTruthy();
	});

	it('opens setup for an unsigned identity and uses index zero when omitted', () => {
		render(card({ pubkyData: defaultPubkyState, index: undefined }));
		fireEvent.press(screen.getByTestId('PubkyBox--Content'));
		fireEvent.press(screen.getByTestId('PubkyBox--ActionButton'));
		expect(mockOnPubkyPress).toHaveBeenCalledWith(KEY, 0);
		expect(showSheet).toHaveBeenCalledWith('edit-pubky', { pubky: KEY });
		expect(screen.getByTestId('PubkyBox-')).toBeTruthy();
		expect(screen.getByText('emptyState.placeholderName #1')).toBeTruthy();
		expect(screen.getByText('pubky.setup')).toBeTruthy();
		expect(screen.queryByTestId('Scan')).toBeNull();
	});

	it('forwards long presses from both the body and the action', () => {
		const onLongPress = jest.fn();
		render(card({ onLongPress }));
		fireEvent(screen.getByTestId(`${CARD_ID}-Content`), 'longPress');
		fireEvent(screen.getByTestId(`${CARD_ID}-ActionButton`), 'longPress');
		expect(onLongPress).toHaveBeenCalledTimes(2);
		expect(mockOnPubkyPress).not.toHaveBeenCalled();
		expect(showSheet).not.toHaveBeenCalled();
	});

	it('disables only the body while loading disables only the action', () => {
		const { rerender } = render(card({ disabled: true }));
		fireEvent.press(screen.getByTestId(`${CARD_ID}-Content`));
		fireEvent.press(screen.getByTestId(`${CARD_ID}-ActionButton`));
		expect(mockOnPubkyPress).not.toHaveBeenCalled();
		expect(showSheet).toHaveBeenCalledTimes(1);
		jest.clearAllMocks();
		rerender(card({ loading: true }));
		fireEvent.press(screen.getByTestId(`${CARD_ID}-Content`));
		fireEvent.press(screen.getByTestId(`${CARD_ID}-ActionButton`));
		expect(mockOnPubkyPress).toHaveBeenCalledTimes(1);
		expect(showSheet).not.toHaveBeenCalled();
	});

	it('keeps backup independently pressable and excludes borrowed and backed-up identities', () => {
		const { rerender } = render(card({ disabled: true, loading: true }));
		fireEvent.press(screen.getByTestId('PubkyBox-BackupButton'));
		expect(showBackupSheet).toHaveBeenCalledWith({
			pubky: PUBKY,
			backupPreference: EBackupPreference.unknown,
		});
		expect(mockOnPubkyPress).not.toHaveBeenCalled();
		expect(showSheet).not.toHaveBeenCalled();
		rerender(card({ pubkyData: { ...defaultPubkyState, isBackedUp: true } }));
		expect(screen.queryByTestId('PubkyBox-BackupButton')).toBeNull();
		rerender(card({ pubkyData: { ...defaultPubkyState, sourceApp: 'to.bitkit' } }));
		expect(screen.queryByTestId('PubkyBox-BackupButton')).toBeNull();
		expect(screen.getByTestId('BitkitBadge').props.pointerEvents).toBe('none');
		expect(screen.getByText('reuseSharedPubky.fallbackName:3')).toBeTruthy();
	});

	it('preserves the native sibling tree, image, name, normalized key and pointer events', () => {
		render(card({ sessionsCount: 3 }));
		expect(screen.getByText('Satoshi ...akamoto!')).toBeTruthy();
		expect(screen.getByText('ona4y...72rda')).toBeTruthy();
		expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: 'stored-avatar.jpg' });
		const outer = screen.toJSON() as ReactTestRendererJSON;
		const nativeCard = outer.children?.[0] as ReactTestRendererJSON;
		const [body, content, action] = nativeCard.children as ReactTestRendererJSON[];
		expect(outer.props.testID).toBe(CARD_ID);
		expect(outer.children).toHaveLength(1);
		expect(nativeCard.children).toHaveLength(3);
		expect(body.props.testID).toBe(`${CARD_ID}-Content`);
		expect(StyleSheet.flatten(body.props.style)).toMatchObject({
			position: 'absolute',
			top: 0,
			right: 0,
			bottom: 0,
			left: 0,
		});
		expect(action.props.testID).toBe(`${CARD_ID}-ActionButton`);
		expect(content.props.pointerEvents).toBe('box-none');
		const [avatar, info, chevron] = content.children as ReactTestRendererJSON[];
		expect(avatar.props.pointerEvents).toBe('none');
		expect(chevron.props.pointerEvents).toBe('none');
		expect(info.props.pointerEvents).toBe('box-none');
		const [name, row] = info.children as ReactTestRendererJSON[];
		expect(name.props.pointerEvents).toBe('none');
		expect(row.props.pointerEvents).toBe('box-none');
		const [key, backup, sessions] = row.children as ReactTestRendererJSON[];
		expect(key.props.pointerEvents).toBe('none');
		expect(backup.props.testID).toBe('PubkyBox-BackupButton');
		expect(sessions.props.pointerEvents).toBeUndefined();
		expect(screen.getByText('3')).toBeTruthy();
	});

	it('lets the shared identity image override the locally stored avatar', () => {
		render(
			<ThemeProvider theme={darkTheme}>
				<SharedPubkyCard
					identity={{ version: 1, sourceApp: 'to.bitkit', pubky: PUBKY, image: 'shared-avatar.jpg' }}
					index={0}
				/>
			</ThemeProvider>,
		);
		expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: 'shared-avatar.jpg' });
	});
});
