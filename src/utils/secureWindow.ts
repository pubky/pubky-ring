import { NativeModules, Platform } from 'react-native';

type SecureWindowModule = {
	setSecure: (enabled: boolean) => void;
};

const secureWindow = NativeModules.SecureWindow as SecureWindowModule | undefined;

export const setSecureWindow = (enabled: boolean): void => {
	if (Platform.OS !== 'android') {
		return;
	}

	secureWindow?.setSecure(enabled);
};
