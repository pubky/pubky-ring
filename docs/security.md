# Security and release verification

This guide records Ring's device-authentication behavior, APK verification options, and manual security checks. For downloads and everyday use, start with the [README](../README.md).

## Optional device authentication

In Settings, **Device authentication** enables a local user-presence check for every authorization and recovery phrase, backup, or migration QR export. It defaults off, including on upgrade. Enabling and disabling both require a fresh successful OS challenge. Auto Auth is overridden while enabled. Enroll biometrics and configure the device screen lock in OS Settings.

The native bridge uses iOS LocalAuthentication (Face ID/Touch ID with passcode fallback) and Android BiometricPrompt (strong biometrics with device credential fallback). On Android API 24–29, device credential fallback uses the system Keyguard confirmation activity; weak face unlock is never enabled. Prompts are serialized and cancellable. Cancellation, expiry, unavailable authentication, or lockout without successful credential fallback never grants approval or disables the preference. Revealed secrets are hidden when leaving the foreground.

On iOS, the inactive-app privacy cover applies only while the recovery phrase reveal, recovery phrase import, or migration QR screen is focused, independently of the device-authentication setting. It also covers backup file import/export while the passphrase is toggled visible; masked passphrase entry does not enable the cover.

This is an application authorization/export gate. It does not migrate Keychain or Keystore records, prevent a compromised process from accessing keys, change native shared-key publishing, control authentication in other apps, or revoke existing remote grants. The current OS enrollment is accepted; enrollment changes do not invalidate Ring credentials. No biometric data is enrolled or stored by Ring.

A native authorization already submitted to the SDK cannot currently be recalled. Cancellation suppresses subsequent steps and UI/callback success, but does not undo a grant already issued by the server.

## Verifying Android releases

Download APKs from the [official releases page](https://github.com/pubky/pubky-ring/releases). A release may include a universal APK and/or APKs for particular CPU architectures. Check its asset list and release notes rather than assuming a particular filename or verification file exists.

Not every release includes detached GPG signatures, a checksum manifest, or a signing key. The repository does not bundle a maintainer public signing key. The steps below apply only when the release provides the relevant files and the maintainer's signing-key fingerprint is available through a trusted channel. Without those, they cannot establish authenticity.

### When detached signatures are provided

Download the APK, its detached signature, and the maintainer's public signing key. Inspect the key and compare its fingerprint with the trusted maintainer fingerprint before importing it:

```sh
gpg --show-keys --with-fingerprint public-key.asc
gpg --import public-key.asc
```

Verify the signature against the matching APK. Substitute the actual release filenames:

```sh
gpg --verify app-universal-release.apk.asc app-universal-release.apk
```

A successful signature check matters only if the signer matches the trusted maintainer key.

### When a signed checksum manifest is provided

Signed Ring releases have used `SHA256SUMS.asc` as a clearsigned message: the checksum text and its signature are in the same file, beginning with `-----BEGIN PGP SIGNED MESSAGE-----`. Verify that file on its own:

```sh
gpg --verify SHA256SUMS.asc
```

Then calculate the hash of the APK you downloaded and compare it with that file's entry inside the verified `SHA256SUMS.asc` message:

```sh
shasum -a 256 app-universal-release.apk
```

The separate, unsigned `SHA256SUMS` file is not authenticated by this command. If GPG warns that this separate file was not verified, use the signed text inside `SHA256SUMS.asc` for the comparison.

On Linux, `sha256sum` can be used instead of `shasum -a 256`. A matching checksum alone checks integrity against the supplied manifest; it does not identify who published either file.

## Physical-device release checks

Run these on physical devices before releasing changes to authorization, device authentication, or recovery/export flows. Automated tests use mocked native responses or simulators and do not cover every OS authentication state.

- Face ID and Touch ID: enable, cancel, success, denied permission, lockout, and passcode fallback; verify disabling also prompts.
- Android API 30+: strong fingerprint/face, credential-only devices, lockout, and devices with weak face unlock (use strong biometrics or credentials).
- Android API 24–29: strong fingerprint, credential fallback, cancellation, and returning from the Keyguard activity without a duplicate prompt or approval.
- Every authorization prompts, including immediately consecutive requests and adopted identities. Saved development Auto Auth cannot skip the check.
- Dismiss, expire, or background a pending request; a late result cannot start authorization, retry signing, reveal secrets, or send a success callback.
- Recovery phrase, encrypted backup, and migration QR all require approval when device authentication is enabled. Returning from the background requires a new reveal challenge.
- Remove/re-enroll biometrics, remove/restore the screen lock, and restart Ring. An enabled preference remains enabled and failures remain closed.

For automated checks and native E2E instructions, see the [development guide](development.md) and [Maestro guide](../.maestro/README.md).
