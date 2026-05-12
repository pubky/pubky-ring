import { ViewStyle, TextStyle } from 'react-native';
import { fontFamily } from './fonts';

export const shadowStyles = {
	small: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	} as ViewStyle,
	medium: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
	} as ViewStyle,
	large: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
	} as ViewStyle,
};

export const textStyles = {
	display: {
		fontSize: 48,
		fontWeight: '700' as const,
		lineHeight: 48,
		letterSpacing: 0,
		fontFamily,
		color: 'white',
	} as TextStyle,
	heading: {
		fontSize: 26,
		fontWeight: '300' as const,
		lineHeight: 26,
		letterSpacing: 0,
		fontFamily,
	} as TextStyle,
	bodyM: {
		fontSize: 17,
		fontWeight: '400' as const,
		lineHeight: 22,
		letterSpacing: 0,
		fontFamily,
		color: 'rgba(255, 255, 255, 0.80)',
	} as TextStyle,
	bodyMSpaced: {
		fontSize: 17,
		fontWeight: '400' as const,
		lineHeight: 22,
		letterSpacing: 0.4,
		fontFamily,
	} as TextStyle,
	bodyMSB: {
		fontSize: 17,
		fontWeight: '600' as const,
		lineHeight: 22,
		letterSpacing: 0.4,
		fontFamily,
	} as TextStyle,
	bodyMB: {
		fontSize: 17,
		fontWeight: '700' as const,
		lineHeight: 22,
		letterSpacing: 0.4,
		fontFamily,
	} as TextStyle,
	bodyS: {
		fontSize: 15,
		fontWeight: '400' as const,
		lineHeight: 20,
		letterSpacing: 0,
		fontFamily,
	} as TextStyle,
	bodySSpaced: {
		fontSize: 15,
		fontWeight: '400' as const,
		lineHeight: 20,
		letterSpacing: 0.4,
		fontFamily,
	} as TextStyle,
	bodySM: {
		fontSize: 15,
		fontWeight: '500' as const,
		lineHeight: 20,
		fontFamily,
	} as TextStyle,
	bodySSB: {
		fontSize: 15,
		fontWeight: '600' as const,
		lineHeight: 20,
		letterSpacing: 0.4,
		fontFamily,
	} as TextStyle,
	caption: {
		fontSize: 13,
		fontWeight: '500' as const,
		lineHeight: 18,
		letterSpacing: 1,
		textTransform: 'uppercase',
		fontFamily,
		color: 'rgba(255, 255, 255, 0.50)',
	} as TextStyle,
	captionSB: {
		fontSize: 13,
		fontWeight: '600' as const,
		lineHeight: 18,
		letterSpacing: 0,
		fontFamily,
	} as TextStyle,
	captionSBSpaced: {
		fontSize: 13,
		fontWeight: '600' as const,
		lineHeight: 18,
		letterSpacing: 0.2,
		fontFamily,
	} as TextStyle,
	captionB: {
		fontSize: 13,
		fontWeight: '700' as const,
		lineHeight: 18,
		letterSpacing: 1,
		textTransform: 'uppercase',
		fontFamily,
	} as TextStyle,
};

export const spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	xxl: 48,
};

export const borderRadius = {
	small: 8,
	medium: 16,
	large: 24,
	round: 100,
	pill: 64,
};
