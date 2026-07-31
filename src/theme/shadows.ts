import type { ViewStyle } from 'react-native';

export const shadows = {
	xs: {
		shadowColor: '#05050A',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.25,
		shadowRadius: 2,
		elevation: 1,
	},
	sm: {
		shadowColor: '#05050A',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: 2,
	},
	lg: {
		shadowColor: '#05050A',
		shadowOffset: {
			width: 0,
			height: 10,
		},
		shadowOpacity: 0.5,
		shadowRadius: 15,
		elevation: 3,
	},
	xl: {
		shadowColor: '#05050A',
		shadowOffset: {
			width: 0,
			height: 20,
		},
		shadowOpacity: 0.5,
		shadowRadius: 20,
		elevation: 5,
	},
} satisfies Record<string, ViewStyle>;
