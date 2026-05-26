# Maestro E2E

This is the iOS simulator E2E suite.

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

## Continuous Integration

`.github/workflows/ios-e2e.yml` builds the iOS simulator app, installs Maestro, boots an iPhone 17 simulator, installs the app, and runs all flows in `.maestro`.

CI requests the staging invite code before invoking Maestro, so the homeserver admin password is not written into Maestro output.
