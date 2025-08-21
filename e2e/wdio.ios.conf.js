const shared = require('./wdio.shared.conf');

const iosSimName = process.env.IOS_SIM || 'iPhone 15';
const appPath = process.env.IOS_APP; // optional .app/.ipa path

exports.config = {
  ...shared.config,
  // Override services for iOS in CI - we'll start Appium manually
  ...(process.env.CI ? {
    services: [],
    // Connect to manually started Appium server
    hostname: '127.0.0.1',
    port: 4723,
    path: '/wd/hub',
  } : {}),
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '17.5',
      'appium:deviceName': iosSimName,
      'appium:newCommandTimeout': 120,
      'appium:appWaitDuration': 120000,
      'appium:derivedDataPath': './e2e/derived-data',
      'appium:useXctestrunFile': false,
      'appium:waitForQuiescence': false,
      'appium:shouldUseSingletonTestManager': false,
      'appium:appWaitForLaunch': true,
      'appium:autoLaunch': true,
      'appium:noReset': true,
      'appium:fullReset': false,
      'appium:enforceAppInstall': false,
      'appium:skipServerInstallation': false,
      'appium:skipDeviceInitialization': false,
      'appium:shouldTerminateApp': true,
      'appium:preventWDAAttachments': true,
      'appium:usePrebuiltWDA': true,
      'appium:useNewWDA': false,
      'appium:showXcodeLog': true,
      'appium:wdaLaunchTimeout': 600000,
      'appium:wdaConnectionTimeout': 600000,
      'appium:wdaStartupRetries': 2,
      'appium:wdaStartupRetryInterval': 15000,

      ...(appPath
        ? { 'appium:app': appPath }
        : {
            // If no app is provided, attach to installed app by bundle id
            'appium:bundleId': process.env.IOS_BUNDLE_ID || 'app.pubkyring',
            'appium:noReset': false,
            'appium:fullReset': false
          })
    }
  ]
};
