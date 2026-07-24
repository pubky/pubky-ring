import { Platform } from 'react-native';
import { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import { isSmallScreen } from '../utils/helpers.ts';

const IOS_SMALL_SCREEN_SPACING = 12;
const ANDROID_DETENT_OVERFLOW_PADDING = 5;

export const getSheetContentHeight = (
	windowHeight: number,
	topInset: number,
	bottomInset: number,
): number | '100%' => {
	if (Platform.OS === 'android') {
		return '100%';
	}

	const spacing = isSmallScreen() ? IOS_SMALL_SCREEN_SPACING : 0;
	return windowHeight - topInset - bottomInset - spacing;
};

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
