# Maestro E2E

This is the Maestro E2E suite for iOS simulators and Android emulators.

## Local iOS

1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Build and install the iOS app on your simulator.
3. Run:

```sh
yarn e2e:ios
```

The custom homeserver flow also requires:

```sh
HOMESERVER_ADMIN_PASSWORD=... yarn e2e:ios
```

## Local Android

1. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`
2. Build and install the Android app on an emulator.
3. Run:

```sh
yarn e2e:android
```

The custom homeserver flow also requires:

```sh
HOMESERVER_ADMIN_PASSWORD=... yarn e2e:android
```

## Continuous Integration

`.github/workflows/ios-e2e.yml` builds the iOS simulator app, installs Maestro, boots an iPhone 17 simulator, installs the app, and runs all flows in `.maestro`.

`.github/workflows/android-e2e.yml` builds the Android APK inside an emulator job, installs Maestro, installs the app, and runs the same flows in `.maestro`.

CI requests the staging invite code before invoking Maestro, so the homeserver admin password is not written into Maestro output. Uploaded Maestro results can include the generated single-run invite code.
