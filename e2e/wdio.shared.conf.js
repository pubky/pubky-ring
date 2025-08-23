/* Shared WebdriverIO config for Appium E2E */
const path = require('path');

exports.config = {
	runner: 'local',
	specs: [path.resolve(__dirname, 'specs/**/*.spec.js')],
	maxInstances: 10,
	logLevel: 'debug',
	bail: 0,
	baseUrl: 'http://localhost',
	waitforTimeout: 30000,
	connectionRetryTimeout: 300000,
	connectionRetryCount: 2,
	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout:  10 * 60 * 1000
	},
	services: [
		[
			'appium'
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
