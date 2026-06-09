#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"

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

bash .maestro/scripts/prepare-device-motion.sh "$platform"

MAESTRO_CLI_NO_ANALYTICS=true \
MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true \
maestro --platform="$platform" test \
  -e APP_ID="$app_id" \
  -e HOMESERVER_ADMIN_PASSWORD="${HOMESERVER_ADMIN_PASSWORD:-}" \
  .maestro
