const shared = require('./wdio.shared.conf');
const path = require('path');
const fs = require('fs');

const avdName = process.env.AVD || 'Pixel_2_API_30';
const envAppPath = process.env.ANDROID_APP; // optional .apk path
const defaultApkPath = path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk');
const resolvedAppPath = envAppPath || (fs.existsSync(defaultApkPath) ? defaultApkPath : undefined);

exports.config = {
  ...shared.config,
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '11',
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
      'appium:xvfbAutoInstall': true,
      'appium:uiautomator2ServerLaunchTimeout': 120000,
      'appium:uiautomator2ServerInstallTimeout': 120000,
      'appium:androidInstallTimeout': 120000,
      'appium:adbExecTimeout': 120000,
      'appium:uiautomator2ServerReadTimeout': 120000,
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
