import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AuthorizedGrantScreen from '../src/screens/AuthorizedGrantScreen';

const mockRouteParams = {
	pubky: 'user-pubky',
	sessionId: 'ring-session',
	grant: {
		grant_id: 'grant-id',
		client_id: 'example.app',
		capabilities: '/priv/example.app/:rwe',
		issued_at: 1_700_000_000,
		expires_at: 1_800_000_000,
	},
};

jest.mock('../src/navigation/hooks', () => ({
	useTypedRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-redux', () => ({
	useSelector: () => ({ name: 'Test Pubky' }),
}));

jest.mock('../src/store/selectors/pubkySelectors', () => ({
	getPubky: jest.fn(),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) =>
			({
				'common.read': 'Read',
				'common.write': 'Write',
				'auth.encryptAndDecryptFolder': 'Encrypt and decrypt files in this folder',
				'auth.encryptAndDecryptFile': 'Encrypt and decrypt this file',
				'auth.encryptAndDecryptAllFiles': 'Encrypt and decrypt all your files',
			})[key] ?? key,
	}),
}));

jest.mock('../src/components/AppHeader', () => ({
	__esModule: true,
	default: () => null,
	HEADER_HEIGHT: 56,
}));

jest.mock('../src/components/Button', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../src/components/Card', () => ({
	__esModule: true,
	default: require('react-native').View,
}));

jest.mock('../src/components/ProfileAvatar', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../src/components/SafeAreaInset', () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock('../src/icons', () => ({
	Folder: () => null,
	Key: () => null,
	XLogo: () => null,
}));

jest.mock('../src/theme/components', () => ({
	ThemedView: require('react-native').View,
}));

jest.mock('../src/theme/typography', () => {
	const { Text } = require('react-native');
	return { TextBaseB: Text, TextSmB: Text, TextSmM: Text, TextXsB: Text, TextXsM: Text };
});

jest.mock('../src/utils/pubky', () => ({
	truncateStr: (value: string) => value,
}));

jest.mock('../src/sheets/sheetNavigation.tsx', () => ({
	showSheet: jest.fn(),
}));

describe('AuthorizedGrantScreen', () => {
	it.each([
		['rwe', 'Read, Write', true],
		['re', 'Read', true],
		['we', 'Write', true],
		['e', '', true],
		['rw', 'Read, Write', false],
	])('displays the granted scope and actions for :%s', (actions, actionLabel, encryptionGranted) => {
		mockRouteParams.grant.capabilities = `/priv/example.app/:${actions}`;
		render(<AuthorizedGrantScreen />);

		expect(screen.getByText('/priv/example.app/')).toBeTruthy();
		if (actionLabel) {
			expect(screen.getByText(actionLabel)).toBeTruthy();
		}
		expect(screen.queryByText('Encrypt and decrypt files in this folder') !== null).toBe(encryptionGranted);
		expect(screen.queryByText('Edit, Delete')).toBeNull();
	});

	it.each([
		['/priv/example.app/file.json', 'Encrypt and decrypt this file'],
		['/', 'Encrypt and decrypt all your files'],
	])('describes encryption for the exact scope %s', (path, label) => {
		mockRouteParams.grant.capabilities = `${path}:e`;
		render(<AuthorizedGrantScreen />);

		expect(screen.getByText(path)).toBeTruthy();
		expect(screen.getByText(label)).toBeTruthy();
		expect(screen.queryByText('Encrypt and decrypt files in this folder')).toBeNull();
	});
});
