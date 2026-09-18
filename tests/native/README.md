# iOS Keychain regression tests

On macOS with Xcode command-line tools:

```sh
bash scripts/test-ios-keychain.sh
```

The test binary compiles the actual `ios/pubkyring/SharedPubky.m` implementation
against Foundation/Security, redirecting every `SecItem` operation to an isolated
in-memory fake. Small React/UIKit declarations replace unavailable UI/bridge
dependencies. The runner rejects binaries linking real `SecItem` functions: it
never reads or changes the host Keychain, simulator data, or real identities.

These tests validate the private operations' native control flow, query scope,
preservation of existing synchronization modes, new non-synchronizable writes,
read-back checks and retry behavior under injected failures. They do not replace
entitlement/signing checks or simulator/device sharing tests against Apple Keychain.
