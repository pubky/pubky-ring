export interface Theme {
	colors: {
		background: string;
		cardBackground: string;
		sessionBorder: string;
		foreground: string;
		text: string;
		textSecondary: string;
		textTertiary: string;
		sessionText: string;
		border: string;
		avatarRing: string;
		buttonBackground: string;
		buttonBorder: string;
		navButton: string;
		gradient: string[];
		modalGradient: string[];
		defaultGradient: string[];
	};
}

export const lightTheme: Theme = {
	colors: {
		background: '#fff',
		cardBackground: '#f8f8f8',
		foreground: '#f0f0f0',
		text: '#333',
		textSecondary: '#666',
		textTertiary: '#999',
		sessionText: '#666',
		sessionBorder: '#eee',
		border: '#ddd',
		avatarRing: '#f5f5f5',
		buttonBackground: '#f5f5f5',
		buttonBorder: '#ddd',
		navButton: '#fff',
		gradient: ['#f8f8f8', '#f8f8f8'],
		modalGradient: ['#f8f8f8', '#f8f8f8'],
		defaultGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'],
	},
};

export const darkTheme: Theme = {
	colors: {
		background: '#000',
		cardBackground: '#333333',
		sessionBorder: '#333333',
		foreground: '#202020',
		text: '#fff',
		textSecondary: 'rgba(255, 255, 255, 0.80)',
		textTertiary: 'rgba(255, 255, 255, 0.64)',
		sessionText: '#ccc',
		border: '#444',
		avatarRing: '#303030',
		buttonBackground: 'rgba(255, 255, 255, 0.1)',
		buttonBorder: 'rgba(255, 255, 255, 0.32)',
		navButton: '#202020',
		gradient: ['#292929', '#262626', '#222222', '#1E1E1E', '#1A1A1A'],
		modalGradient: ['#1A1A1A', '#181818', '#131313', '#0C0C0C', '#010101', '#010101'],
		defaultGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)'],
	},
};
