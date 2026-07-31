import { configureToast, type NativeToastConfig } from '@synonymdev/react-native-toast';

const variantStyles: NativeToastConfig['variants'] = {
	success: {
		backgroundColor: '#374408',
		borderColor: '#80a104',
	},
	info: {
		backgroundColor: '#041f3b',
		borderColor: '#02529d',
	},
	warning: {
		backgroundColor: '#442b08',
		borderColor: '#a16204',
	},
	error: {
		backgroundColor: '#440508',
		borderColor: '#a10204',
	},
};

configureToast({
	options: {
		haptics: true,
	},
	defaults: {
		borderRadius: 8,
		padding: 24,
		iosBlurEffect: 'dark',
		iosBlurAmount: 10,
		iosBlurTintOpacity: 0.8,
	},
	variants: variantStyles,
});
