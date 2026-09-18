#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."
test_dir=$(mktemp -d "${TMPDIR:-/tmp}/ring-keychain-tests.XXXXXX")
trap 'rm -rf "$test_dir"' EXIT

xcrun --sdk macosx clang -fobjc-arc -fblocks -Wall -Wextra -Werror \
  -Wno-unused-parameter -I tests/native/stubs \
  -framework Foundation -framework Security \
  tests/native/SharedPubkyKeychainTests.m \
  -o "$test_dir/keychain-tests"

# All Keychain I/O must resolve to the in-memory fake. Never touch the host or simulator vault.
undefined_symbols=$(nm -u "$test_dir/keychain-tests")
if [[ "$undefined_symbols" == *"_SecItem"* ]]; then
  echo 'ERROR: test binary links a real SecItem operation' >&2
  exit 1
fi
"$test_dir/keychain-tests"
