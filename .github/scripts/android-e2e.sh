#!/usr/bin/env bash
set -euo pipefail

trap 'adb logcat -d > "$GITHUB_WORKSPACE/android-logcat.txt" || true' EXIT
RECOVERY_PHRASE="${RECOVERY_PHRASE:-abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about}"

cd "$GITHUB_WORKSPACE/android"
./gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon
APK_PATH="$(find app/build/outputs/apk/release -maxdepth 1 -name '*.apk' -print -quit)"
if [[ -z "$APK_PATH" ]]; then
  echo "No release APK found in app/build/outputs/apk/release" >&2
  exit 1
fi
adb install -r "$APK_PATH"

cd "$GITHUB_WORKSPACE"
bash .maestro/scripts/prepare-device-motion.sh android
bash .maestro/scripts/set-system-clipboard.sh android "$RECOVERY_PHRASE"

INVITE_CODE="$(
  curl --fail --silent --show-error \
    -H "X-Admin-Password: $HOMESERVER_ADMIN_PASSWORD" \
    -H "Content-Type: application/json" \
    https://admin.homeserver.staging.pubky.app/generate_signup_token
)"
INVITE_CODE_COMPACT="${INVITE_CODE//-/}"
echo "::add-mask::$INVITE_CODE"
echo "::add-mask::$INVITE_CODE_COMPACT"

maestro --platform=android test -e APP_ID=to.pubky.ring -e INVITE_CODE="$INVITE_CODE" -e RECOVERY_PHRASE="$RECOVERY_PHRASE" .maestro
