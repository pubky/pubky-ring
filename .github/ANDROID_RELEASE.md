# Android release workflow

The `Android Release Bundle` workflow builds an unsigned Android App Bundle when a `v*` release tag is pushed, then signs that exact artifact in a separate job using the Google Play upload key. The tag must match the Android `versionName` and point to a commit on `main`.

## One-time repository setup

Create a GitHub environment named `android-release` and configure:

- Deployment tags: `v*` only.

Add these environment secrets:

- `PUBKYRING_UPLOAD_KEYSTORE_BASE64`: the upload keystore encoded as a single-line base64 value.
- `PUBKYRING_UPLOAD_STORE_PASSWORD`: the upload keystore password.
- `PUBKYRING_UPLOAD_KEY_ALIAS`: the upload key alias.
- `PUBKYRING_UPLOAD_KEY_PASSWORD`: the upload key password.

Add this environment variable:

- `PUBKYRING_UPLOAD_CERT_SHA256`: the SHA-256 certificate fingerprint shown by `keytool`. Colons and letter casing are optional.

Generate the base64 keystore value without adding line breaks:

```sh
openssl base64 -A -in /path/to/upload-key.jks
```

Read the upload certificate fingerprint:

```sh
keytool -list -v -keystore /path/to/upload-key.jks -alias UPLOAD_KEY_ALIAS
```

Use only the replaceable Google Play upload key. Do not store the Play app-signing key in GitHub.

## Create a release bundle

1. Update the Android `versionName` and `versionCode`, merge the release commit into `main`, and confirm required checks are green.
2. Tag that commit with the matching version, for example `git tag v2.0`.
3. Push the tag, for example `git push origin v2.0`. This starts the workflow automatically.
4. Download the `android-release-aab-<commit SHA>` artifact.
5. Verify the included SHA-256 checksum and `release-metadata.txt` before uploading the signed AAB to Play Console.

The intermediate unsigned artifact is retained for one day. The signed release artifact is retained for 30 days.
