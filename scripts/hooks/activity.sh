#!/bin/bash
# Activity Hook - Thin Wrapper
# All logic is in TypeScript handler

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HANDLER="${REPO_ROOT}/dist/hooks/activity-handler.js"

# Read stdin and pass directly to TypeScript handler
cat | node "$HANDLER"
