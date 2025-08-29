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
		    modalGradient: string[];
        defaultGradient: string[];
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
		modalGradient: ['#f8f8f8', '#f8f8f8'],
		defaultGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)']
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
		gradient: ['#292929', '#262626', '#222222', '#1E1E1E', '#1A1A1A'],
		modalGradient: ['#1A1A1A', '#181818', '#131313', '#0C0C0C', '#010101', '#010101'],
		defaultGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)']
	},
};
