import { DefaultTheme } from 'styled-components/native';

export interface Theme extends DefaultTheme {
    colors: {
        background: string;
		cardBackground: string;
		cardButton: string;
        sessionBorder: string;
        foreground: string;
        text: string;
        sessionText: string;
        border: string;
		buttonBorder: string;
        avatarRing: string;
        actionButton: string;
        navButton: string;
		gradient: string[];
    }
}

export const lightTheme: Theme = {
	colors: {
		background: '#fff',
		cardBackground: '#f8f8f8',
		cardButton: '#fff',
		foreground: '#f0f0f0',
		text: '#333',
		sessionText: '#666',
		sessionBorder: '#eee',
		border: '#ddd',
		buttonBorder: '#ddd',
		avatarRing: '#f5f5f5',
		actionButton: '#f5f5f5',
		navButton: '#fff',
		gradient: ['#f8f8f8', '#f8f8f8'],
	},
};

export const darkTheme: Theme = {
	colors: {
		background: '#000',
		cardBackground: '#333333',
		cardButton: '#333333',
		sessionBorder: '#333333',
		foreground: '#202020',
		text: '#fff',
		sessionText: '#ccc',
		border: '#444',
		buttonBorder: '#fff',
		avatarRing: '#303030',
		actionButton: '#1A1A1A',
		navButton: '#202020',
		gradient: ['#202020', '#1A1A1A'],
	},
};
