import { TextInputProps } from 'react-native';

export interface Theme {
	keyboardAppearance: NonNullable<TextInputProps['keyboardAppearance']>;
	colors: {
		// Accent colors
		pubkyRing: string;
		pubkyApp: string;
		danger: string;

		// Text colors
		textPrimary: string;
		textSecondary: string;
		textTertiary: string;

		// UI colors
		background: string;
		buttonBackground: string;
		buttonBorder: string;
		cardGradient: string[];
		toastBackground: string;
		toastBorder: string;
	};
}

export type ThemeColorName = {
	[Name in keyof Theme['colors']]: Theme['colors'][Name] extends string ? Name : never;
}[keyof Theme['colors']];

export const accentColors = {
	pubkyRing: '#0085FF',
	pubkyApp: '#C8FF00',
	danger: '#FF0000',
};

export const lightTheme: Theme = {
	keyboardAppearance: 'light',
	colors: {
		...accentColors,
		background: '#fff',
		textPrimary: '#333',
		textSecondary: '#666',
		textTertiary: '#999',
		buttonBackground: '#f5f5f5',
		buttonBorder: '#ddd',
		cardGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'],
		toastBackground: '#f8f8f8',
		toastBorder: '#ddd',
	},
};

export const darkTheme: Theme = {
	keyboardAppearance: 'dark',
	colors: {
		...accentColors,
		background: '#000',
		textPrimary: '#fff',
		textSecondary: 'rgba(255, 255, 255, 0.80)',
		textTertiary: 'rgba(255, 255, 255, 0.64)',
		buttonBackground: 'rgba(255, 255, 255, 0.1)',
		buttonBorder: 'rgba(255, 255, 255, 0.32)',
		cardGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'],
		toastBackground: '#333333',
		toastBorder: '#444',
	},
};
