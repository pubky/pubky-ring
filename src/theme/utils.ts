import { ViewStyle, TextStyle } from 'react-native';

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

export const buttonStyles = {
	primary: {
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center' as const,
		minHeight: 64,
	} as ViewStyle,
	secondary: {
		borderWidth: 1,
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center' as const,
	} as ViewStyle,
	small: {
		borderRadius: 100,
		paddingVertical: 8,
		paddingHorizontal: 16,
		alignItems: 'center' as const,
	} as ViewStyle,
	primaryOutline: {
		borderWidth: 1,
		borderColor: 'white',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center' as const,
	} as ViewStyle,
	compact: {
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center' as const,
		minHeight: 48,
	} as ViewStyle,
	compactOutline: {
		borderWidth: 1,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center' as const,
		height: 58,
	} as ViewStyle,
	fullWidth: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center' as const,
	} as ViewStyle,
};

export const textStyles = {
	heading: {
		fontSize: 26,
		fontWeight: '300' as const,
		lineHeight: 26,
	} as TextStyle,
	body: {
		fontSize: 15,
		fontWeight: '600' as const,
		lineHeight: 20,
		letterSpacing: 0.4,
	} as TextStyle,
	backupText: {
		color: '#0085FF',
	},
	backupTextBGColor: 'rgba(0, 133, 255, 0.16)',
	caption: {
		fontSize: 13,
		fontWeight: '500' as const,
		lineHeight: 16,
	} as TextStyle,
	button: {
		fontSize: 15,
		fontWeight: '600' as const,
		lineHeight: 18,
		letterSpacing: 0.2,
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
