import { Platform } from 'react-native';

export const fontFamily = Platform.select({
	android: 'inter_tight',
	default: 'InterTight-VariableFont_wght',
});
