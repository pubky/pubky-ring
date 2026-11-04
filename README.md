# Pubky Ring

### Your keychain for the Pubky ecosystem. Manage your pubkys, authorize services, and stay in control—no accounts, no passwords.

Pubky Ring is the key manager for your identity in the Pubky ecosystem. It lets you securely manage your pubkys—the public keys that power your presence across decentralized apps.

# What You Can Do
- Authorize or revoke access to services
- Organize and sync your pubkys across devices
- View and control active sessions
- Stay fully self-custodial, with no accounts or tracking

# Accepted Input Formats

Pubky Ring accepts input via deeplinks, QR code scanning, and clipboard pasting. All parsing is handled by `src/utils/inputParser.ts`.

## Deeplinks

**Registered URL schemes:** `pubkyring://` and `pubkyauth://`

| Action | Format | Parameters |
|--------|--------|------------|
| Auth | `pubkyauth:///?relay={url}&secret={secret}&caps={caps}` | `relay`: relay URL, `secret`: secret key, `caps`: comma-separated capabilities |
| Sign In | `pubkyring://signin?caps=...&secret=...&relay=...` | Same as Auth (converted internally) |
| Signup | `pubkyring://signup?hs={homeserver}&relay=...&secret=...&caps=...[&st={signup_token}]` | Creates an account and authorizes an app; `st` is optional |
| Direct Signup | `pubkyauth://direct_signup?hs={homeserver}[&st={signup_token}]` | Creates an account without app authorization; `st` is optional |
| Legacy Direct Signup | `pubkyauth://signup?hs={homeserver}[&st={signup_token}]` | Backward-compatible account creation without app authorization |
| Migrate | `pubkyring://migrate?index={n}&total={total}&key={key}` | `index`: 0-based frame index, `total`: frame count, `key`: mnemonic or secret key |

## Clipboard (Pasting)

| Format | Example | Action |
|--------|---------|--------|
| Recovery Phrase | `word1 word2 word3 ... word12` (12 BIP39 words) | Import |
| Encrypted Secret Key | Encrypted key string | Import |
| Invite Code | `XXXX-XXXX-XXXX` | Invite |
| Invite URL | `https://example.com/invite/XXXX-XXXX-XXXX` | Invite (code extracted) |
| Any deeplink | `pubkyring://signup?...` | Same as deeplink |

**Note:** Pasted input is normalized—hyphens, underscores, and plus signs are converted to spaces for recovery phrases.

## QR Code Scanning

Accepts all deeplink and clipboard formats when encoded in a QR code. Additionally supports:

| Format | Description |
|--------|-------------|
| Animated QR | Multi-frame QR codes cycling through migrate deeplinks for bulk key import |

## Input Priority Order

When parsing input, the first matching format wins:

1. Migrate deeplinks
2. Signup deeplinks
3. Sign-in deeplinks
4. Auth URLs (`pubkyauth:///`)
5. Invite codes in URLs
6. Standalone invite codes
7. Recovery phrases (12 words)
8. Encrypted secret keys
9. Unknown (fallback)

# Getting Started

## Environment requirements
- Node.js >= 20
- Yarn 1.x

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

Ensure the APK you downloaded is authentic and untampered by verifying its **GPG signature** and **SHA256 checksum**. Android releases may include a universal APK (for example, `app-universal-release.apk`) and/or ABI-specific APKs (for example, `app-arm64-v8a-release.apk`).

### 1. Import the Maintainer's GPG Key

```bash
gpg --import public-key.asc
```

### 2. Verify the APK Signature

```bash
gpg --verify <apk-file>.asc <apk-file>
```

### 3. Verify the Checksum

```bash
gpg --verify SHA256SUMS.asc
sha256sum -c SHA256SUMS
```

## E2E testing (Maestro)

E2E tests use Maestro. See [`.maestro/README.md`](.maestro/README.md) for local and CI usage.

## Optional device authentication

In Settings, **Device authentication** enables a local
user-presence check for every authorization and recovery phrase, backup, or
migration QR export. It defaults off, including on upgrade. Enabling and disabling
both require a fresh successful OS challenge. Auto Auth is overridden while enabled.
Enroll biometrics and configure the device screen lock in OS Settings.

The native bridge uses iOS LocalAuthentication (Face ID/Touch ID with passcode
fallback) and Android BiometricPrompt (strong biometrics with device credential
fallback). On Android API 24–29, device credential fallback uses the system
Keyguard confirmation activity; weak face unlock is never enabled. Prompts are
serialized and cancellable. Cancellation, expiry, unavailable authentication, or
lockout without successful credential fallback never grants approval or disables
the preference. Revealed secrets are hidden when leaving the foreground.
On iOS, the inactive-app privacy cover applies only while the recovery phrase reveal,
recovery phrase import, or migration QR screen is focused, independently of the device
authentication setting. It also covers backup file import/export while the passphrase
is toggled visible; masked passphrase entry does not enable the cover.

This is an application authorization/export gate. It does not migrate Keychain or
Keystore records, prevent a compromised process from accessing keys, change native
shared-key publishing, control authentication in other apps, or revoke existing
remote grants. The current OS enrollment is accepted; enrollment changes do not
invalidate Ring credentials. No biometric data is enrolled or stored by Ring.

Before release, verify on physical devices:

- Face ID and Touch ID: enable, cancel, success, denied permission, lockout and
  passcode fallback; verify disabling also prompts.
- Android API 30+: strong fingerprint/face, credential-only devices, lockout,
  and devices with weak face unlock (use strong biometrics or credentials).
- Android API 24–29: strong fingerprint, credential fallback, cancellation and
  returning from the Keyguard activity without a duplicate prompt or approval.
- Every authorization prompts, including immediately consecutive requests and
  adopted identities. Saved development Auto Auth cannot skip the check.
- Dismiss, expire or background a pending request; a late result cannot start
  authorization, retry signing, reveal secrets or send a success callback.
- Recovery phrase, encrypted backup and migration QR all require approval before
  reading secrets. Returning from the background requires a new reveal challenge.
- Remove/re-enroll biometrics, remove/restore the screen lock, and restart Ring.
  An enabled preference remains enabled and failures remain closed.

A native authorization already submitted to the SDK cannot currently be recalled;
cancellation suppresses subsequent steps and UI/callback success, but does not
undo a grant already issued by the server.
