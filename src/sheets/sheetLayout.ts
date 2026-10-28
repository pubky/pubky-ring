import { Platform } from 'react-native';
import { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import { isSmallScreen } from '../utils/helpers.ts';

const ANDROID_DETENT_OVERFLOW_PADDING = 5;

export const getSheetDetent = (windowHeight: number, topInset: number, bottomInset: number): number => {
	if (isSmallScreen()) {
		return 1;
	}

	const availableHeight = windowHeight - topInset;
	let sheetHeight = availableHeight - HEADER_HEIGHT;

	if (Platform.OS === 'android') {
		// Android measures form-sheet detents slightly shorter than the visual content area.
		sheetHeight += bottomInset + ANDROID_DETENT_OVERFLOW_PADDING;
	}

	return sheetHeight / availableHeight;
};
