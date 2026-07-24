#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"
flow="${2:-.maestro}"

case "$platform" in
  android)
    app_id="app.pubkyring"
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

bash .maestro/scripts/prepare-device-motion.sh "$platform"

MAESTRO_CLI_NO_ANALYTICS=true \
MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true \
maestro --platform="$platform" test \
  -e APP_ID="$app_id" \
  -e HOMESERVER_ADMIN_PASSWORD="${HOMESERVER_ADMIN_PASSWORD:-}" \
  "$flow_target"
