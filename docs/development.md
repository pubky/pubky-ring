# Developing Pubky Ring

For downloads and user instructions, start with the [README](../README.md).

## Requirements

- Node.js 24, matching CI. Other supported Node versions are listed in [package.json](../package.json).
- Yarn Classic 1.22.22, as pinned in `packageManager`.
- For iOS: macOS, Xcode, an iOS simulator or device, and CocoaPods. CI uses Xcode 26; the Podfile also includes compatibility handling for Xcode 27 resource-bundle deployment targets.
- For Android: Android Studio, an emulator or device, and JDK 17. Install the Android SDK and NDK versions specified in [android/build.gradle](../android/build.gradle).

See React Native's [environment setup guide](https://reactnative.dev/docs/set-up-your-environment) for platform tooling. Native dependencies and project configuration in this repository determine the versions needed for Ring.

## Install and run

```sh
git clone https://github.com/pubky/pubky-ring.git
cd pubky-ring
yarn install --frozen-lockfile
```

Install iOS pods before the first iOS build, and again after native dependency changes:

```sh
cd ios
pod install
cd ..
```

Start Metro in a terminal:

```sh
yarn start
```

In another terminal, run the platform you want to develop on:

```sh
yarn ios --interactive
```

```sh
yarn android
```

You can also open `ios/pubkyring.xcworkspace` in Xcode or the `android` project in Android Studio. Use the workspace after installing pods, rather than the iOS project file.

## Checks and tests

```sh
yarn lint
yarn typecheck
yarn test --runInBand
yarn format:check
```

`yarn format` formats `src`. For files outside that directory, invoke Prettier on the specific files you changed.

Maestro runs the same flows against iOS simulators and Android emulators. The [Maestro guide](../.maestro/README.md) covers installation, prerequisites, staging invite setup, individual flows, and CI. For example, after installing a build on your simulator or emulator:

```sh
yarn e2e:ios homeserver-management
yarn e2e:android homeserver-management
```

The local runners prepare reduced motion on the target device. Follow the Maestro guide for environment variables required by signup flows. Do not put homeserver admin credentials into flow files or commit them.

CI runs ESLint, TypeScript/Jest, and the two native E2E suites. Mocked native unit tests do not replace the [physical-device security checks](security.md#physical-device-release-checks).

The manually dispatched [Android Debug-Signed APK workflow](../.github/workflows/android-debug-signed-apk.yml) produces a release-mode test build using the committed debug keystore. This supports testing shared identities with compatible Bitkit test builds; it is not a production signing configuration.

## Homeserver setup behavior

The catalog in Settings is shared across all local pubkys. Each pubky has its own homeserver association, while the catalog stores reusable names and the preferred server for new setups. Editing a catalog entry changes its label; its public key remains read-only. Servers still associated with a pubky cannot be removed.

Freshly generated keys skip discovery and immediately offer signup on the preferred server. For imported keys or reopened setup with no known account, Ring looks up the public homeserver mapping before choosing a default. This accounts for the **Checking homeserver…** state: the key may already have an account, in which case Ring should offer Sign in without asking for another invite. Lookup errors offer a retry; they do not establish that a new signup is needed.

Direct-signup QR codes and pasted links in setup select the server and populate a draft invite for review before submission. Invite codes are transient. Synonym servers are currently treated as requiring an invite for new signup; custom servers can be tried without an invite and reveal the field when their response requires one.

Label-only Save remains independent of a valid connection configuration. Sign-out is a separate confirmed action for that pubky in this Ring installation. It revokes Ring's grants while preserving the public mapping, server data, and other apps' access. Credentials whose older-server revocation is uncertain remain as cleanup-only records rather than active sessions.

Known limits:

- Switching homeservers does not automatically move app data.
- Reconnecting to a previously registered server that is no longer publicly mapped still needs targeted sign-in support. See [#135](https://github.com/pubky/pubky-ring/issues/135) and [upstream #670](https://github.com/pubky/pubky-homeserver/issues/670).
- Importing an account whose public mapping is missing leaves the key unconfigured. Ring does not automatically republish a default mapping to recover it; an explicit, user-confirmed recovery flow is still follow-up work from [#357](https://github.com/pubky/pubky-ring/pull/357).

## Integration and security references

- [Input formats](input-formats.md): links, QR codes, clipboard parsing, and callbacks.
- [Security guide](security.md): optional device authentication, privacy cover, release verification, and manual release checks.
- [React Native troubleshooting](https://reactnative.dev/docs/troubleshooting): platform setup and build problems.

Keep the README headline aligned with the official [Pubky Ring landing page](https://pubkyring.app/). Update the product preview with sample identities when the interface changes.
