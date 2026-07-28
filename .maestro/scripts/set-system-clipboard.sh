#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"
text="${2:-${RECOVERY_PHRASE:-}}"

if [ -z "$text" ]; then
  echo "Usage: $0 ios|android <text>" >&2
  echo "Or set RECOVERY_PHRASE." >&2
  exit 1
fi

case "$platform" in
  ios)
    device="${SIM_UDID:-${IOS_SIM_UDID:-booted}}"
    printf '%s' "$text" | xcrun simctl pbcopy "$device"
    ;;
  android)
    echo "Android system clipboard is not set from adb; flows use inputText fallback." >&2
    ;;
  *)
    echo "Usage: $0 ios|android [text]" >&2
    exit 1
    ;;
esac
