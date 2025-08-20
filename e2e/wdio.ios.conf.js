const shared = require('./wdio.shared.conf');

const iosSimName = process.env.IOS_SIM || 'iPhone 15';
const appPath = process.env.IOS_APP; // optional .app/.ipa path

exports.config = {
  ...shared.config,
  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '17.5',
      'appium:deviceName': iosSimName,
      'appium:newCommandTimeout': 120,
      'appium:appWaitDuration': 120000,
      'appium:appWaitForLaunch': true,
      'appium:autoLaunch': true,
      'appium:noReset': false,
      'appium:fullReset': true,
      'appium:enforceAppInstall': true,
      'appium:skipServerInstallation': false,
      'appium:skipDeviceInitialization': false,
      'appium:shouldTerminateApp': true,
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
