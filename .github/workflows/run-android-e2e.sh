#!/bin/bash

# Create video output directory
mkdir -p ./e2e/artefacts

# Start video recording from Android emulator using screenrecord
#echo "Starting Android emulator video recording..."
#adb shell screenrecord /sdcard/test-recording.mp4 &
#VIDEO_PID=$!

# Start meminfo monitoring in background loop every 10ms
#while true; do
#  echo "adb shell cat /proc/meminfo"
#  adb shell cat /proc/meminfo &
#  sleep 0.5
#done &
#MEMINFO_PID=$!

# Run the actual tests
echo "yarn e2e:android"
npm e2e:android

## Kill the background processes
#kill $MEMINFO_PID 2>/dev/null || true
#kill $VIDEO_PID 2>/dev/null || true
#
## Wait a moment for video to finish writing
#sleep 2
#
## Pull the video file from the device
#echo "Pulling video recording from device..."
#adb pull /sdcard/test-recording.mp4 ./e2e/artefacts/test-recording.mp4
#
## Clean up the video file from the device
#adb shell rm /sdcard/test-recording.mp4
