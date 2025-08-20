const shared = require('./wdio.shared.conf');
const path = require('path');
const fs = require('fs');

const avdName = process.env.AVD || 'Pixel_6_API_34';
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
      'appium:avd': avdName,
      'appium:autoGrantPermissions': true,
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
      ...(resolvedAppPath
        ? {
            'appium:app': resolvedAppPath,
            'appium:noReset': false,
            'appium:fullReset': false
          }
        : {
            'appium:appPackage': process.env.APP_PACKAGE || 'to.pubky.ring',
            'appium:appActivity': process.env.APP_ACTIVITY || 'to.pubkyring.MainActivity',
            'appium:appWaitActivity': process.env.APP_WAIT_ACTIVITY || '*',
            'appium:noReset': false,
            'appium:fullReset': false,
            'appium:forceAppLaunch': false
          })
    }
  ]
};
