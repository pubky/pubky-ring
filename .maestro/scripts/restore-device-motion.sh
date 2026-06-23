#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"

case "$platform" in
  ios)
    device="${SIM_UDID:-${IOS_SIM_UDID:-booted}}"

    xcrun simctl spawn "$device" defaults write com.apple.Accessibility ReduceMotionEnabled -bool NO || true
    xcrun simctl spawn "$device" defaults write com.apple.Accessibility ReduceMotion -bool NO || true
    ;;
  android)
    adb shell settings put global window_animation_scale 1.0
    adb shell settings put global transition_animation_scale 1.0
    adb shell settings put global animator_duration_scale 1.0
    ;;
  *)
    echo "Usage: $0 ios|android" >&2
    exit 1
    ;;
esac
