#!/usr/bin/env bash
set -euo pipefail

trap 'adb logcat -d > "$GITHUB_WORKSPACE/android-logcat.txt" || true' EXIT

cd "$GITHUB_WORKSPACE/android"
./gradlew \
  :app:assembleDebug \
  -PRING_BUNDLE_DEBUG_JS=true \
  -PreactNativeArchitectures=x86_64 \
  --no-daemon
APK_PATH="$(find app/build/outputs/apk/debug -maxdepth 1 -name '*.apk' -print -quit)"
if [[ -z "$APK_PATH" ]]; then
  echo "No debug APK found in app/build/outputs/apk/debug" >&2
  exit 1
fi
if ! unzip -tqq "$APK_PATH" assets/index.android.bundle >/dev/null; then
  echo "Debug E2E APK is missing its packaged JavaScript bundle" >&2
  exit 1
fi
adb install -r "$APK_PATH"

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

maestro --platform=android test -e APP_ID=app.pubkyring -e INVITE_CODE="$INVITE_CODE" .maestro
