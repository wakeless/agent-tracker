#!/bin/bash
# Generic Terminal Provider for Agent Tracker
# Works on any Unix-like system with basic terminal support

set -euo pipefail

# Extract basic terminal information from environment
TERM_PROGRAM="${TERM_PROGRAM:-unknown}"
TERM_SESSION_ID="${TERM_SESSION_ID:-unknown}"
LC_TERMINAL="${LC_TERMINAL:-unknown}"
LC_TERMINAL_VERSION="${LC_TERMINAL_VERSION:-unknown}"

# Output generic terminal info as JSON
# This provides the minimum required fields for compatibility
jq -nc \
  --arg session_id "$TERM_SESSION_ID" \
  --arg profile "unknown" \
  --arg tab_name "unknown" \
  --arg window_name "unknown" \
  '{
    session_id: $session_id,
    profile: $profile,
    tab_name: $tab_name,
    window_name: $window_name
  }'

exit 0
