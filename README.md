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
| Signup | `pubkyring://signup?hs={homeserver}&st={signup_token}&relay=...&secret=...&caps=...` | `hs`: homeserver URL, `st`: invite/signup token |
| Session | `pubkyring://session?callback={callback_url}` | `callback`: URL-encoded callback URL |
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
3. Session deeplinks
4. Sign-in deeplinks
5. Auth URLs (`pubkyauth:///`)
6. Invite codes in URLs
7. Standalone invite codes
8. Recovery phrases (12 words)
9. Encrypted secret keys
10. Unknown (fallback)

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
