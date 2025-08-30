/* Shared WebdriverIO config for Appium E2E */
const path = require('path');
const fs = require('fs');

const avdName = process.env.AVD || 'Pixel_6';
const envAppPath = process.env.ANDROID_APP; // optional .apk path
const defaultApkPath = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
const resolvedAppPath = envAppPath || (fs.existsSync(defaultApkPath) ? defaultApkPath : undefined);

exports.config = {
    capabilities: [
      {
                                  platformName: 'Android',
                                  'appium:automationName': 'UiAutomator2',
                      'appium:userProfile': 0,
                                  'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '12',
                                  'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
                                  'appium:avd': avdName,
                                  'appium:autoGrantPermissions': true,
                                  'appium:browserstack.deviceLogs': true,
                                  'appium:newCommandTimeout': 3000,
                                  'appium:fullReset': false,
                                  'appium:noReset': false,
                                  'appium:adbExecTimeout': 300_000,
                                  'appium:uiautomator2ServerLaunchTimeout': 300_000,
                                  'appium:uiautomator2ServerInstallTimeout': 300_000,
                                  'appium:androidInstallTimeout': 300_000,
                                  'appium:ignoreHiddenApiPolicyError': true,
                                  'appium:appWaitForLaunch': false,
                      'appium:showChromedriverLog': true,
                      'appium:logcatFormat': 'raw',
                      'appium:logcatFilterSpecs': ['*:*'],
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
    ],
	runner: 'local',
	specs: [path.resolve(__dirname, 'specs/**/*.spec.js')],
	maxInstances: 1,
	logLevel: 'debug',
    port: 4723,
	bail: 0,
	baseUrl: 'http://localhost',
	headless: true,
	waitforTimeout: 30_000,
	connectionRetryTimeout: 300_000,
	connectionRetryCount: 2,
	xvfbAutoInstall: true,
	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 120_000
	},
	services: [
		[
			'appium', { args: { log:'./logs/appium.log', relaxedSecurity: true } }
		]
	],

	// Test hooks
	// beforeSuite: async function (test) {
	//   // Install APK in CI environment for Android
	//   if (process.env.CI && driver.capabilities.platformName === 'Android') {
	//     try {
	//       console.log('📱 Installing APK in CI environment...');
	//       await driver.installApp('/Users/runner/work/pubkyring/pubkyring/artifacts/app-release.apk');
	//       console.log('✅ APK installed successfully');
	//     } catch (error) {
	//       console.log('⚠️ APK installation failed:', error.message);
	//     }
	//   }

	//   if (process.env.RECORD_VIDEO === 'true') {
	//     await driver.startRecordingScreen();
	//   }
	//   console.log(`🧪 Start: ${test.parent} - ${test.title}`);
	// },

	// afterSuite: async function (_test) {
	//   if (process.env.CI && driver.capabilities.platformName === 'Android') {
	//     driver.resetApp();
	//   }

	//   if (process.env.RECORD_VIDEO === 'true') {
	//     await driver.stopRecordingScreen();
	//   }
	// }
};
