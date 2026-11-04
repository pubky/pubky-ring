import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProfileAvatar from '../src/components/ProfileAvatar';

let mockStoredName: string | undefined;

jest.mock('react-redux', () => ({
	useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));
jest.mock('../src/store/selectors/pubkySelectors.ts', () => ({
	getPubky: () => ({ name: mockStoredName, sourceApp: 'Bitkit' }),
	getPubkyImage: () => '',
}));
jest.mock('react-native-facehash', () => ({
	Facehash: ({ onRenderMouth }: { onRenderMouth: () => React.ReactNode }) =>
		require('react').createElement(require('react-native').View, null, onRenderMouth()),
}));

it.each(['pubky #1 (Bitkit)', 'pubky #12 (Bitkit)'])(
	'uses the key initial for %s with both full and truncated display names',
	storedName => {
		mockStoredName = storedName;
		const { rerender } = render(<ProfileAvatar pubky="arfs4-public-key" name={storedName} />);
		expect(screen.getByText('A')).toBeTruthy();
		rerender(<ProfileAvatar pubky="arfs4-public-key" name="pubky #1...(Bitkit)" />);
		expect(screen.getByText('A')).toBeTruthy();
		expect(screen.queryByText('P')).toBeNull();
	},
);

it('uses the stored custom name for its initial', () => {
	mockStoredName = 'Alice';
	render(<ProfileAvatar pubky="barfs-public-key" name="Alice" />);
	expect(screen.getByText('A')).toBeTruthy();
});

it('uses the supplied name for an identity not stored in Ring', () => {
	mockStoredName = undefined;
	render(<ProfileAvatar pubky="barfs-public-key" name="Carol" external />);
	expect(screen.getByText('C')).toBeTruthy();
});
