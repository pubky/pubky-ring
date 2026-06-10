#!/usr/bin/env bash
set -euo pipefail

platform="${1:-}"

case "$platform" in
  ios)
    device="${SIM_UDID:-${IOS_SIM_UDID:-booted}}"

    # Reduce Motion is read by React Native's AccessibilityInfo API on app start.
    xcrun simctl spawn "$device" defaults write com.apple.Accessibility ReduceMotionEnabled -bool YES || true
    xcrun simctl spawn "$device" defaults write com.apple.Accessibility ReduceMotion -bool YES || true
    ;;
  android)
    adb shell settings put global window_animation_scale 0.0
    adb shell settings put global transition_animation_scale 0.0
    adb shell settings put global animator_duration_scale 0.0
    ;;
  *)
    echo "Usage: $0 ios|android" >&2
    exit 1
    ;;
esac
