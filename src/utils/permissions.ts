import {
	check,
	request,
	PERMISSIONS,
	RESULTS,
} from 'react-native-permissions';
import { Platform } from 'react-native';
import i18n from '../i18n';

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
				title: i18n.t('permissions.cameraTitle'),
				message: i18n.t('permissions.cameraMessage'),
				buttonPositive: i18n.t('common.ok'),
				buttonNegative: i18n.t('common.cancel'),
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

