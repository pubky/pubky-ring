const shared = require('./wdio.shared.conf');

const avdName = process.env.AVD || 'Pixel_6_API_34';
const appPath = process.env.ANDROID_APP; // optional .apk/.aab path

exports.config = {
  ...shared.config,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14',
      'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
      'appium:avd': avdName,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 120,
      ...(appPath
        ? { 'appium:app': appPath }
        : {
            // If no app is provided, connect to an already running RN app
            'appium:appPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
            'appium:appActivity': process.env.APP_ACTIVITY || '.MainActivity',
            'appium:noReset': true,
            'appium:fullReset': false
          })
    }
  ]
};

const shared = require('./wdio.shared.conf');
const path = require('path');

const apkPath = process.env.ANDROID_APP || path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
const avdName = process.env.AVD_NAME || 'Pixel_7_Pro_API_35';

module.exports = {
  ...shared,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
      'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '14',
      'appium:avd': avdName,
      'appium:app': apkPath,
      'appium:autoGrantPermissions': true,
      'appium:newCommandTimeout': 120,
    },
  ],
};
