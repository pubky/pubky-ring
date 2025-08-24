# Start logcat capture for the entire duration
echo "=== Starting logcat capture ==="
adb logcat -c  # Clear logcat buffer
adb logcat > logcat.txt 2>&1 &
LOGCAT_PID=$!

# Wait for emulator to be stable
echo "=== Waiting for emulator to be stable ==="
sleep 15

# Run tests
echo "=== Starting E2E tests ==="
yarn e2e:android
TEST_EXIT_CODE=$?

# Stop logcat capture
echo "=== Stopping logcat capture ==="
kill $LOGCAT_PID 2>/dev/null || true
wait $LOGCAT_PID 2>/dev/null || true

# Exit with test result
exit $TEST_EXIT_CODE