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
			'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '13',
			'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
			'appium:avd': avdName,
			'appium:noReset': false,
			'appium:fullReset': true,
			'appium:relaxedSecurity': true,
			'appium:allowTestPackages': true,
			'appium:sessionOverride': true,
			'appium:autoGrantPermissions': true,
			'appium:adbExecTimeout': 300000,
			'appium:uiautomator2ServerLaunchTimeout': 300000,
			'appium:uiautomator2ServerInstallTimeout': 300000,
			'appium:androidInstallTimeout': 300000,
			'appium:relaxedSecurity': true,
			...(resolvedAppPath
				? {
					'appium:app': resolvedAppPath,
					'appium:appWaitPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
					'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:forceAppLaunch': true
				}
				: {
					'appium:appPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
					'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:forceAppLaunch': false
				})
		}
	]
};
