# Pubky Ring

### Your keychain for the Pubky ecosystem. Manage your pubkys, authorize services, and stay in control—no accounts, no passwords.

Pubky Ring is the key manager for your identity in the Pubky ecosystem. It lets you securely manage your pubkys—the public keys that power your presence across decentralized apps.

# What You Can Do
- Authorize or revoke access to services
- Organize and sync your pubkys across devices
- View and control active sessions
- Stay fully self-custodial, with no accounts or tracking

# Getting Started

## Installation

### Clone the repository:
```bash
git clone https://github.com/pubky/pubky-ring && cd pubky-ring
```

### Install the dependencies:
```bash
yarn install
# For iOS you may also need the following:
cd ios && pod install && cd ..
```
### Run the Application

**For iOS:**
```bash
yarn ios
```

**For Android:**
```bash
yarn android
```
If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# 🔐 Verifying Releases

Ensure your `app-release.apk` is authentic and untampered by verifying its **GPG signature** and **SHA256 checksum**.

### 1. Import the Maintainer's GPG Key

```bash
gpg --import public-key.asc
```

### 2. Verify the APK Signature

```bash
gpg --verify app-release.apk.asc app-release.apk
```

### 3. Verify the Checksum

```bash
gpg --verify SHA256SUMS.asc
sha256sum -c SHA256SUMS
```

## E2E testing (Appium + WebdriverIO)

This project includes Appium/WebdriverIO E2E tests for Android emulators and iOS simulators.

Prerequisites:
- Xcode with an iOS Simulator (e.g., "iPhone 15").
- Android SDK with an AVD (e.g., "Pixel_7_Pro_API_35").
- Java JDK 17+ and Node.js 18+.

Install drivers (one-time):

```bash
npm run e2e:drivers
```

Build the apps:
- Android APK (Debug):
```bash
cd android && ./gradlew assembleDebug
```
- iOS app (Debug) for simulator:
```bash
xcodebuild -workspace ios/pubkyring.xcworkspace -scheme pubkyring -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build
```

Run tests:
- Android:
```bash
npm run e2e:android
```
- iOS:
```bash
npm run e2e:ios
```

Environment overrides:
- ANDROID_APP: absolute path to the .apk
- AVD: Android Virtual Device name (e.g., Pixel_6_API_34)
- ANDROID_DEVICE_NAME / ANDROID_PLATFORM_VERSION
- APP_PACKAGE / APP_ACTIVITY (defaults: to.pubky.ring / .MainActivity)
- IOS_APP: absolute path to the .app
- IOS_SIM / IOS_PLATFORM_VERSION
- IOS_BUNDLE_ID (default: app.pubkyring)

Examples:

```bash
# Android (provide APK)
ANDROID_APP=/absolute/path/app-debug.apk npm run e2e:android

# Android (attach to installed app on an emulator)
AVD=Pixel_6_API_34 npm run e2e:android

# iOS (provide .app)
IOS_APP=/absolute/path/pubkyring.app npm run e2e:ios

# iOS (attach to installed app on a simulator)
IOS_SIM="iPhone 15" npm run e2e:ios
```
