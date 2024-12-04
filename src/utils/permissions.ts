import {
	check,
	request,
	PERMISSIONS,
	RESULTS,
} from 'react-native-permissions';
import { Platform } from 'react-native';

export const requestCameraPermission = async (): Promise<boolean> => {
	const cameraPermission =
			Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
	const checkResponse = await check(cameraPermission);
	switch (checkResponse) {
		case RESULTS.UNAVAILABLE:
		case RESULTS.BLOCKED:
			return false;
		case RESULTS.DENIED:
			const rationale = {
				title: 'Permission to use camera',
				message: 'Pubky Ring needs permission to use your camera',
				buttonPositive: 'OK',
				buttonNegative: 'Cancel',
			};
			const requestResponse = await request(cameraPermission, rationale);
			switch (requestResponse) {
				case RESULTS.GRANTED:
					return true;
				default:
					return false;
			}
		case RESULTS.LIMITED:
		case RESULTS.GRANTED:
			return true;
	}
};

