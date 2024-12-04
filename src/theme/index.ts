import { DefaultTheme } from 'styled-components/native';

export interface Theme extends DefaultTheme {
    colors: {
        background: string;
        sessionBackground: string;
        sessionBorder: string;
        foreground: string;
        text: string;
        sessionText: string;
        border: string;
        avatarRing: string;
        actionButton: string;
        navButton: string;
    }
}

export const lightTheme: Theme = {
	colors: {
		background: '#fff',
		sessionBackground: '#f8f8f8',
		foreground: '#f0f0f0',
		text: '#333',
		sessionText: '#666',
		sessionBorder: '#eee',
		border: '#ddd',
		avatarRing: '#f5f5f5',
		actionButton: '#f5f5f5',
		navButton: '#fff',
	},
};

export const darkTheme: Theme = {
	colors: {
		background: '#000',
		sessionBackground: '#1a1a1a',
		sessionBorder: '#333333',
		foreground: '#202020',
		text: '#fff',
		sessionText: '#ccc',
		border: '#444',
		avatarRing: '#303030',
		actionButton: '#303030',
		navButton: '#202020',
	},
};
