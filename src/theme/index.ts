import { TextInputProps } from 'react-native';

export interface Theme {
	keyboardAppearance: NonNullable<TextInputProps['keyboardAppearance']>;
	colors: {
		// Base colors
		background: string;
		foreground: string;
		primary: string;
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
		pubkyApp: string;
		danger: string;
	};
}

export type ThemeColorName = {
	[Name in keyof Theme['colors']]: Theme['colors'][Name] extends string ? Name : never;
}[keyof Theme['colors']];

export const BLUE_RADIAL_GRADIENT = ['rgba(0, 133, 255, 0.32)', 'transparent'];

export const accentColors = {
	blue: '#0085FF',
	pubkyApp: '#C8FF00',
	danger: '#FF0000',
};

export const lightTheme: Theme = {
	keyboardAppearance: 'light',
	colors: {
		...accentColors,
		background: '#fff',
		foreground: '#333',
		primary: '#babac1',
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
		primary: '#babac1',
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
