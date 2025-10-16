# Terminal Providers

This directory contains modular terminal information providers for the Agent Tracker hooks.

## Overview

Terminal providers are lightweight shell scripts that detect and extract terminal-specific information. The core hook scripts (`session-start.sh` and `session-end.sh`) automatically detect the terminal type and call the appropriate provider.

## Provider Contract

### Input
Providers receive terminal detection via environment variables:
- `$TERM_PROGRAM` - Terminal application name (e.g., "iTerm.app", "vscode")
- `$TERM` - Terminal type (e.g., "xterm-256color")
- `$SHELL` - Current shell path
- All other standard environment variables

### Output
Providers must output **valid JSON** to stdout containing terminal-specific data:

```json
{
  "session_id": "string or unknown",
  "profile": "string or unknown",
  "tab_name": "string or unknown",
  "window_name": "string or unknown"
}
```

Additional fields can be added for terminal-specific features, but the above four fields are required for compatibility.

### Exit Codes
- `0` - Success, JSON output will be used
- `non-zero` - Failure, core hook will fall back to generic provider

### Error Handling
Providers should:
- Set `set -euo pipefail` for robust error handling
- Use `|| echo "unknown"` for fields that might fail
- Never crash - always output valid JSON or exit non-zero

## Available Providers

### generic.sh
Default provider that works on any Unix-like system.
- Captures basic terminal environment variables
- No external dependencies
- Always succeeds (exit 0)

### iterm2.sh
Provider for iTerm2 on macOS.
- Detects: `TERM_PROGRAM == "iTerm.app"`
- Uses AppleScript to fetch tab and window names
- Requires: `osascript` command (macOS only)
- Falls back to generic if AppleScript fails

## Provider Selection Logic

The core hooks use this detection order:

1. Check `$TERM_PROGRAM`:
   - `iTerm.app` → `iterm2.sh`
   - (future) `vscode` → `vscode.sh`
   - (future) `WindowsTerminal` → `windows-terminal.sh`

2. If provider fails (non-zero exit) → fall back to `generic.sh`

3. If no specific provider matches → use `generic.sh`

## Creating a New Provider

1. Copy `template.sh` to `your-terminal.sh`
2. Implement the detection logic (check `$TERM_PROGRAM` or other env vars)
3. Extract terminal-specific information
4. Output JSON matching the contract
5. Add detection logic to core hooks (`session-start.sh` and `session-end.sh`)
6. Test with your terminal

### Example: Adding Alacritty Support

```bash
#!/bin/bash
# Provider for Alacritty terminal

set -euo pipefail

# Detect if we're running in Alacritty
if [[ "${TERM_PROGRAM:-}" != "alacritty" ]]; then
  exit 1
fi

# Extract Alacritty-specific info
# (Alacritty doesn't expose much via env vars, but we can still detect it)
ALACRITTY_VERSION="${ALACRITTY_VERSION:-unknown}"

# Output JSON
jq -nc \
  --arg session_id "unknown" \
  --arg profile "unknown" \
  --arg tab_name "unknown" \
  --arg window_name "unknown" \
  --arg version "$ALACRITTY_VERSION" \
  '{
    session_id: $session_id,
    profile: $profile,
    tab_name: $tab_name,
    window_name: $window_name,
    alacritty_version: $version
  }'
```

Then add to the core hooks:
```bash
if [[ "$TERM_PROGRAM" == "alacritty" ]]; then
  TERMINAL_JSON=$("${SCRIPT_DIR}/providers/alacritty.sh" 2>/dev/null || \
                  "${SCRIPT_DIR}/providers/generic.sh")
fi
```

## Testing Providers

Test a provider independently:
```bash
export TERM_PROGRAM="iTerm.app"
./providers/iterm2.sh | jq '.'
```

Verify it outputs valid JSON and includes all required fields.

## Platform-Specific Notes

### macOS
- iTerm2: Use AppleScript (`osascript`) for rich terminal info
- Terminal.app: Similar to iTerm2, but with different AppleScript syntax
- VS Code: Check `$TERM_PROGRAM` and `$VSCODE_*` variables

### Linux
- Most terminals expose limited info via environment variables
- Use `$TERM`, `$COLORTERM`, `$TERM_PROGRAM` for detection
- Window managers might expose additional info

### Windows
- Windows Terminal: Check for `WT_SESSION`, `WT_PROFILE_ID`
- Git Bash / WSL: Similar to Linux terminals
- Requires cross-platform compatible scripting (bash on WSL)

## Dependencies

All providers should minimize external dependencies:
- **Required**: `jq` (JSON processing)
- **Optional**: Platform-specific commands (e.g., `osascript` for macOS)
- Always gracefully degrade if optional commands are missing
