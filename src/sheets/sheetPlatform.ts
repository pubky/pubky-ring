import { Platform } from 'react-native';

const MAX_ANDROID_SHEET_FALLBACK_API_LEVEL = 33;

export const shouldUseAndroidSheetFallback = (): boolean => {
	return Platform.OS === 'android' && Platform.Version <= MAX_ANDROID_SHEET_FALLBACK_API_LEVEL;
};
