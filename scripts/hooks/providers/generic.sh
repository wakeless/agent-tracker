#!/bin/bash
# Generic Terminal Provider for Agent Tracker
# Works on any Unix-like system with basic terminal support

set -euo pipefail

# Extract basic terminal information from environment
TERM_SESSION_ID="${TERM_SESSION_ID:-unknown}"

# Output generic terminal info as JSON using Node.js CLI
# Find the CLI relative to this script (go up 3 levels from providers/ to repo root)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CLI_PATH="${REPO_ROOT}/dist/hooks/cli.js"

# Create JSON input for the CLI
JSON_INPUT=$(cat <<EOF
{
  "session_id": "$TERM_SESSION_ID"
}
EOF
)

# Call Node.js CLI to create JSON output
echo "$JSON_INPUT" | node "$CLI_PATH" --operation=create-generic-provider

exit 0
