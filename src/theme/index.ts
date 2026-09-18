import { TextInputProps } from 'react-native';

export interface Theme {
	keyboardAppearance: NonNullable<TextInputProps['keyboardAppearance']>;
	colors: {
		// Base colors
		background: string;
		foreground: string;
		secondary: string;
		primaryForeground: string;
		secondaryForeground: string;
		mutedForeground: string;
		card: string;
		muted: string;
		popover: string;
		border: string;
		input: string;

		// Accent colors
		blue: string;
		orange: string;
		pubkyApp: string;
		danger: string;
	};
}

export type ThemeColorName = {
	[Name in keyof Theme['colors']]: Theme['colors'][Name] extends string ? Name : never;
}[keyof Theme['colors']];

export const BLUE_RADIAL_GRADIENT = ['rgba(0, 133, 255, 0.32)', 'transparent'];

/** Outline of a surface that is offered but not adopted yet, e.g. an unconnected Bitkit pubky. */
export const DASHED_BORDER_COLOR = 'rgba(255, 255, 255, 0.32)';

export const accentColors = {
	blue: '#0085FF',
	// Bitkit brand orange, used to mark identities that stay managed by Bitkit.
	orange: '#FF4400',
	pubkyApp: '#C8FF00',
	danger: '#FF0000',
};

export const lightTheme: Theme = {
	keyboardAppearance: 'light',
	colors: {
		...accentColors,
		background: '#fff',
		foreground: '#333',
		secondary: '#303034',
		primaryForeground: '#1D1D20',
		secondaryForeground: '#666',
		mutedForeground: '#999',
		card: '#1D1D20',
		muted: '#303034',
		popover: '#05050A',
		border: '#ddd',
		input: '#525252',
	},
};

export const darkTheme: Theme = {
	keyboardAppearance: 'dark',
	colors: {
		...accentColors,
		background: '#000',
		foreground: '#fff',
		secondary: '#303034',
		primaryForeground: '#1D1D20',
		secondaryForeground: '#D4D4DB',
		mutedForeground: '#89898F',
		card: '#1D1D20',
		muted: '#303034',
		popover: '#05050A',
		border: '#303034',
		input: '#525252',
	},
};
