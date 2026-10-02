#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"
flow="${2:-.maestro}"

case "$platform" in
  android)
    app_id="to.pubky.ring"
    ;;
  ios)
    app_id="app.pubkyring"
    ;;
  *)
    echo "Usage: $0 ios|android" >&2
    exit 1
    ;;
esac

if [ "$flow" != ".maestro" ]; then
  if [ -f "$flow" ]; then
    flow_target="$flow"
  elif [ -f ".maestro/flows/$flow" ]; then
    flow_target=".maestro/flows/$flow"
  elif [ -f ".maestro/flows/$flow.yaml" ]; then
    flow_target=".maestro/flows/$flow.yaml"
  else
    flow_target="$flow"
  fi
else
  flow_target=".maestro"
fi

cleanup_ios_backup_files() {
  local simulator_root="$HOME/Library/Developer/CoreSimulator/Devices"
  local udids

  udids="$(xcrun simctl list devices booted | awk -F'[()]' '/Booted/{print $2}')"

  while IFS= read -r udid; do
    [ -n "$udid" ] || continue

    find "$simulator_root/$udid/data/Containers/Shared/AppGroup" \
      -path "*/File Provider Storage/pubky-backup-*.pkarr" \
      -type f \
      -delete 2>/dev/null || true
  done <<< "$udids"
}

cleanup_android_backup_files() {
  adb shell 'rm -f /sdcard/Download/PubkyRing/pubky-backup-*.pkarr' || true
}

if [ "$platform" = "ios" ] && [ "$(basename "$flow_target")" = "backup-and-import-file.yaml" ]; then
  cleanup_ios_backup_files
fi

if [ "$platform" = "android" ] && [ "$(basename "$flow_target")" = "backup-and-import-file.yaml" ]; then
  cleanup_android_backup_files
fi

bash .maestro/scripts/prepare-device-motion.sh "$platform"

MAESTRO_CLI_NO_ANALYTICS=true \
MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true \
maestro --platform="$platform" test \
  -e APP_ID="$app_id" \
  -e HOMESERVER_ADMIN_PASSWORD="${HOMESERVER_ADMIN_PASSWORD:-}" \
  "$flow_target"
