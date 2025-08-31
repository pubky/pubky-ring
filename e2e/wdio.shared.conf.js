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
                                  maxInstances: 1,
                                  'appium:settings[waitForIdleTimeout]': 0,
                                  'appium:printPageSourceOnFindFailure': true,
                                  "appium:newCommandTimeout" : "30",
                                  'appium:automationName': 'UiAutomator2',
                                  'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '13',
                                  'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
                                  'appium:avd': avdName,
                                  'appium:autoGrantPermissions': true,
                                  'appium:allowTestPackages': true,
                                  'appium:app': resolvedAppPath,
                                  'appium:forceAppLaunch': false
      }
    ],
	runner: 'local',
	specs: [['./specs/**/*.spec.js']],
	maxInstances: 1,
	logLevel: 'debug',
	bail: 0,
	headless: true,
	waitforTimeout: 130_000,
	connectionRetryTimeout: 120000,
	connectionRetryCount: 3,
//	xvfbAutoInstall: true,
	framework: 'mocha',
	reporters: ['spec'],
    tsConfigPath: '../tsconfig.json',
    port: 4723,
	mochaOpts: {
		ui: 'bdd',
		timeout: 120_000
	},
    logLevels: {
        webdriver: 'debug',
        '@wdio/appium-service': 'debug',
        'appium-uiautomator2-server': 'debug',
        'appium-uiautomator2-driver': 'debug',
        'appium': 'debug',
    },
	services: [
		[
			'appium', { args: { log:'./logs/appium.log', relaxedSecurity: true, sessionOverride: true, debugLogSpacing: true, nativeInstrumentsLib: false } }
		]
	],

	// Test hooks
	 beforeSuite: async function (test) {
             if (process.env.RECORD_VIDEO === 'true') {
                       await driver.startRecordingScreen();
                     }
	 },

	// afterSuite: async function (_test) {
	//   if (process.env.CI && driver.capabilities.platformName === 'Android') {
	//     driver.resetApp();
	//   }

	//   if (process.env.RECORD_VIDEO === 'true') {
	//     await driver.stopRecordingScreen();
	//   }
	// }
};
