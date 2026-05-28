const shared = require('./wdio.shared.conf');

const iosSimName = process.env.IOS_SIM || 'iPhone 17';
const appPath = process.env.IOS_APP; // optional .app/.ipa path

exports.config = {
	...shared.config,
	capabilities: [
		{
			platformName: 'iOS',
			'wdio:maxInstances': 1,
			'appium:automationName': 'XCUITest',
			'appium:deviceName': iosSimName,
			// 'appium:useNewWDA': false,
			// 'appium:preventWDAAttachments': true,
			'appium:noReset': false,
			'appium:fullReset': false,
			'appium:shouldTerminateApp': true,
			'appium:autoAcceptAlerts': true,
			'appium:autoDismissAlerts': true,

			// Stability improvements
			'appium:simulatorStartupTimeout': 300_000,
			'appium:newCommandTimeout': 300,
			'appium:wdaLaunchTimeout': 300_000,
			'appium:wdaConnectionTimeout': 300_000,
			'appium:wdaStartupRetries': 3,
			'appium:wdaStartupRetryInterval': 5000,

			...(appPath
				? { 'appium:app': appPath }
				: {
						// If no app is provided, attach to installed app by bundle id
						'appium:bundleId': process.env.IOS_BUNDLE_ID || 'app.pubkyring',
					}),
		},
	],
};
