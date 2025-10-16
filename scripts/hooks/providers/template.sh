#!/bin/bash
# Terminal Provider Template for Agent Tracker
# Copy this file and customize for your specific terminal

set -euo pipefail

# ==============================================================================
# STEP 1: DETECTION
# ==============================================================================
# Verify we're running in the target terminal.
# Check environment variables like $TERM_PROGRAM, $TERM, or other identifiers.
# Exit with non-zero code if this provider doesn't apply.

# Example: Detect if running in "MyTerminal"
# if [[ "${TERM_PROGRAM:-}" != "MyTerminal" ]]; then
#   exit 1
# fi

# ==============================================================================
# STEP 2: CHECK DEPENDENCIES
# ==============================================================================
# Verify that required commands are available.
# Exit with non-zero code if dependencies are missing.

# Example: Check for a required command
# if ! command -v some_command >/dev/null 2>&1; then
#   exit 1
# fi

# ==============================================================================
# STEP 3: EXTRACT TERMINAL INFORMATION
# ==============================================================================
# Gather terminal-specific information from environment variables,
# external commands, or APIs.

# Required fields (set to "unknown" if not available):
SESSION_ID="unknown"    # Terminal session identifier
PROFILE="unknown"       # Terminal profile/theme name
TAB_NAME="unknown"      # Current tab/pane title
WINDOW_NAME="unknown"   # Window title

# Example: Extract from environment variables
# SESSION_ID="${MY_TERMINAL_SESSION_ID:-unknown}"
# PROFILE="${MY_TERMINAL_PROFILE:-unknown}"

# Example: Extract using external commands
# TAB_NAME=$(my_terminal_cli get-tab-name 2>/dev/null || echo "unknown")
# WINDOW_NAME=$(my_terminal_cli get-window-name 2>/dev/null || echo "unknown")

# Optional: Add terminal-specific fields
# CUSTOM_FIELD="${MY_TERMINAL_CUSTOM:-unknown}"

# ==============================================================================
# STEP 4: OUTPUT JSON
# ==============================================================================
# Output a JSON object containing the terminal information.
# MUST include the four required fields: session_id, profile, tab_name, window_name
# Additional fields are optional.

jq -nc \
  --arg session_id "$SESSION_ID" \
  --arg profile "$PROFILE" \
  --arg tab_name "$TAB_NAME" \
  --arg window_name "$WINDOW_NAME" \
  '{
    session_id: $session_id,
    profile: $profile,
    tab_name: $tab_name,
    window_name: $window_name
  }'

# Optional: Add custom fields to the JSON output
# jq -nc \
#   --arg session_id "$SESSION_ID" \
#   --arg profile "$PROFILE" \
#   --arg tab_name "$TAB_NAME" \
#   --arg window_name "$WINDOW_NAME" \
#   --arg custom_field "$CUSTOM_FIELD" \
#   '{
#     session_id: $session_id,
#     profile: $profile,
#     tab_name: $tab_name,
#     window_name: $window_name,
#     custom_field: $custom_field
#   }'

exit 0

# ==============================================================================
# INTEGRATION STEPS
# ==============================================================================
# After creating your provider:
#
# 1. Make it executable:
#    chmod +x providers/my-terminal.sh
#
# 2. Test it independently:
#    export TERM_PROGRAM="MyTerminal"
#    ./providers/my-terminal.sh | jq '.'
#
# 3. Add detection logic to session-start.sh and session-end.sh:
#
#    if [[ "$TERM_PROGRAM" == "MyTerminal" ]]; then
#      TERMINAL_PROVIDER_JSON=$("${SCRIPT_DIR}/providers/my-terminal.sh" 2>/dev/null || \
#                               "${SCRIPT_DIR}/providers/generic.sh")
#    elif [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
#      ...
#    fi
#
# 4. Test with a real Claude session in your terminal
#
# 5. Verify the JSONL output includes your terminal's information:
#    tail -1 ~/.agent-tracker/sessions.jsonl | jq '.terminal.iterm'
#
