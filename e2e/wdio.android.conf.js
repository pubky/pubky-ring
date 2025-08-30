const shared = require('./wdio.shared.conf');
const path = require('path');
const fs = require('fs');

const avdName = process.env.AVD || 'Pixel_6';
const envAppPath = process.env.ANDROID_APP; // optional .apk path
const defaultApkPath = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
const resolvedAppPath = envAppPath || (fs.existsSync(defaultApkPath) ? defaultApkPath : undefined);

exports.config = {
	...shared.config,
	capabilities: [
		{
			platformName: 'Android',
			'appium:automationName': 'UiAutomator2',
			'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '12',
			'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
			'appium:avd': avdName,
			'appium:autoGrantPermissions': true,
			'appium:newCommandTimeout': 300,
			'appium:fullReset': false,
			'appium:noReset': false,
			'appium:adbExecTimeout': 300_000,
			'appium:uiautomator2ServerLaunchTimeout': 300_000,
			'appium:uiautomator2ServerInstallTimeout': 300_000,
			'appium:androidInstallTimeout': 300_000,
			"appium:ignoreHiddenApiPolicyError": true,
			...(resolvedAppPath
				? {
					'appium:app': resolvedAppPath,
					'appium:appWaitPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
					'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || '*',
					'appium:forceAppLaunch': false
				}
				: {
					'appium:appPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
					'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || '*',
					'appium:forceAppLaunch': false
				})
		}
	]
};
