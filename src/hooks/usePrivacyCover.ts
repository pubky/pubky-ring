import { useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

type PrivacyCoverModule = {
	setEnabled: (enabled: boolean) => void;
};

/** Covers the iOS app when inactive only while this sensitive screen is focused. */
export const usePrivacyCover = (): void => {
	useFocusEffect(
		useCallback(() => {
			if (Platform.OS !== 'ios') return;
			const privacyCover = NativeModules.PrivacyCover as PrivacyCoverModule | undefined;
			privacyCover?.setEnabled(true);
			return () => privacyCover?.setEnabled(false);
		}, []),
	);
};
