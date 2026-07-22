import { NativeModules } from 'react-native';

type AppInfoConstants = {
	version?: string;
	buildNumber?: string;
	applicationId?: string;
};

const appInfo = NativeModules.AppInfo as AppInfoConstants | undefined;

export const appVersion = appInfo?.version ?? '';
export const appBuildNumber = appInfo?.buildNumber ?? '';
export const appApplicationId = appInfo?.applicationId ?? '';
