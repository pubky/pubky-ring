#!/usr/bin/env bash
set -euo pipefail

trap 'adb logcat -d > "$GITHUB_WORKSPACE/android-logcat.txt" || true' EXIT

cd "$GITHUB_WORKSPACE/android"
./gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon
adb install -r app/build/outputs/apk/release/app-release.apk

cd "$GITHUB_WORKSPACE"
bash .maestro/scripts/prepare-device-motion.sh android

INVITE_CODE="$(
  curl --fail --silent --show-error \
    -H "X-Admin-Password: $HOMESERVER_ADMIN_PASSWORD" \
    -H "Content-Type: application/json" \
    https://admin.homeserver.staging.pubky.app/generate_signup_token
)"
INVITE_CODE_COMPACT="${INVITE_CODE//-/}"
echo "::add-mask::$INVITE_CODE"
echo "::add-mask::$INVITE_CODE_COMPACT"

maestro --platform=android test -e APP_ID=to.pubky.ring -e INVITE_CODE="$INVITE_CODE" .maestro
