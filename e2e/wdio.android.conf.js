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
			'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14',
			'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
			'appium:avd': avdName, // same as deviceName?
			'appium:autoGrantPermissions': true,
			'appium:newCommandTimeout': 300,
			'appium:fullReset': false,
			'appium:noReset': false,
			'appium:avdLaunchTimeout': 600_000,
			'appium:avdReadyTimeout': 600_000,
			'appium:adbExecTimeout': 600_000,
			'appium:uiautomator2ServerLaunchTimeout': 600_000,
			'appium:uiautomator2ServerInstallTimeout': 600_000,
			'appium:androidInstallTimeout': 600_000,
			'appium:deviceReadyTimeout': 600_000,
			'appium:androidDeviceReadyTimeout': 600_000,
			// Additional stability options
			'appium:skipServerInstallation': false,
			'appium:skipDeviceInitialization': false,
			'appium:systemPort': 8200,
			'appium:mjpegScreenshotUrl': '',
			'appium:clearSystemFiles': false,
			//'appium:enforceXPath1': true,
			'appium:waitForIdleTimeout': 600_000,
			'appium:waitForQuiescence': true,
			'appium:shouldTerminateApp': true,
			'appium:forceAppLaunch': true,
			'appium:autoLaunch': true,
			'appium:appWaitDuration': 60000,
			'appium:appWaitForLaunch': true,
			...(resolvedAppPath
				? {
					'appium:app': resolvedAppPath,
					'appium:appWaitPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
					'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || 'to.pubkyring.MainActivity'
				}
				: {
					'appium:appPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
					'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
					'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || 'to.pubkyring.MainActivity'
				})
		}
	]
};
