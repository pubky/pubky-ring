export interface Theme {
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
		cardBackground: string;
		foreground: string;
		border: string;
		avatarRing: string;
		buttonBackground: string;
		buttonBorder: string;
		navButton: string;
		gradient: string[];
		defaultGradient: string[];
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
	colors: {
		...accentColors,
		background: '#fff',
		cardBackground: '#f8f8f8',
		foreground: '#f0f0f0',
		textPrimary: '#333',
		textSecondary: '#666',
		textTertiary: '#999',
		border: '#ddd',
		avatarRing: '#f5f5f5',
		buttonBackground: '#f5f5f5',
		buttonBorder: '#ddd',
		navButton: '#fff',
		gradient: ['#f8f8f8', '#f8f8f8'],
		defaultGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'],
	},
};

export const darkTheme: Theme = {
	colors: {
		...accentColors,
		background: '#000',
		cardBackground: '#333333',
		foreground: '#202020',
		textPrimary: '#fff',
		textSecondary: 'rgba(255, 255, 255, 0.80)',
		textTertiary: 'rgba(255, 255, 255, 0.64)',
		border: '#444',
		avatarRing: '#303030',
		buttonBackground: 'rgba(255, 255, 255, 0.1)',
		buttonBorder: 'rgba(255, 255, 255, 0.32)',
		navButton: '#202020',
		gradient: ['#292929', '#262626', '#222222', '#1E1E1E', '#1A1A1A'],
		defaultGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'],
	},
};
