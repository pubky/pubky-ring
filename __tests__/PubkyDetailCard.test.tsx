import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PubkyDetailCard from '../src/components/PubkyDetail/PubkyDetailCard';
import { defaultPubkyState } from '../src/store/shapes/pubky';
import type { PubkyData } from '../src/navigation/types';

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/i18n', () => ({
	__esModule: true,
	default: { t: (key: string) => key },
}));

jest.mock('../src/components/Button.tsx', () => {
	const ReactMock = require('react');
	const { Pressable, Text } = require('react-native');

	return {
		__esModule: true,
		default: ({ onPress, testID, text }: { onPress?: () => void; testID?: string; text: string }) =>
			ReactMock.createElement(Pressable, { onPress, testID }, ReactMock.createElement(Text, null, text)),
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

	return { __esModule: true, default: () => ReactMock.createElement(View, { testID: 'ProfileAvatar' }) };
});

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

	return { __esModule: true, Scan: asIcon(), Share: asIcon(), Shield: asIcon(), Trash: asIcon() };
});

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({ __esModule: true, showSheet: jest.fn() }));

jest.mock('../src/utils/helpers.ts', () => ({ __esModule: true, shareData: jest.fn(async () => {}) }));

jest.mock('../src/utils/clipboard', () => ({ __esModule: true, copyToClipboard: jest.fn() }));

jest.mock('@synonymdev/react-native-toast', () => ({ __esModule: true, showToast: jest.fn() }));

const PUBKY = 'x2a3p48wsbpr3ue9d4qj41ge1kcc6r7fdiy6o3ugj2rrhis59p1b';

const renderCard = (pubkyData: PubkyData): void => {
	render(
		<PubkyDetailCard
			index={1}
			pubky={PUBKY}
			pubkyData={pubkyData}
			onQRPress={jest.fn(async () => {})}
			onDelete={jest.fn()}
			onBackup={jest.fn()}
		/>,
	);
};

const pubkyData = (overrides: Partial<PubkyData> = {}): PubkyData => ({
	...defaultPubkyState,
	pubky: PUBKY,
	signedUp: true,
	...overrides,
});

describe('PubkyDetailCard', () => {
	it('badges a Bitkit pubky and offers no backup for it', () => {
		renderCard(pubkyData({ sourceApp: 'to.bitkit' }));

		expect(screen.getByTestId('BitkitBadge')).toBeTruthy();
		expect(screen.queryByTestId('PubkyDetailBackupButton')).toBeNull();
		expect(screen.getByTestId('PubkyDetailDeleteButton')).toHaveTextContent('reuseSharedPubky.disconnect');
	});

	it('leaves an owned pubky without the badge and with backup available', () => {
		renderCard(pubkyData());

		expect(screen.queryByTestId('BitkitBadge')).toBeNull();
		expect(screen.getByTestId('PubkyDetailBackupButton')).toBeTruthy();
		expect(screen.getByTestId('PubkyDetailDeleteButton')).toHaveTextContent('common.delete');
	});
});
