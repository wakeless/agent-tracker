---
sidebar_position: 3
---

# Terminal Support

Agent Tracker uses a modular terminal provider system to extract rich context from your terminal emulator.

## Overview

Terminal providers are shell scripts that query the terminal for specific information like tab names, window names, and session identifiers. This contextual information helps you quickly identify which session belongs to which terminal.

## Supported Terminals

### iTerm2 (macOS)

Full support with rich metadata extraction.

**Captured Information:**
- Tab name
- Window name
- Profile name
- Session ID (used for deep linking)
- Window and tab indices

**How It Works:**

The iTerm2 provider uses AppleScript to query iTerm2 for terminal-specific information. When Agent Tracker detects `TERM_PROGRAM=iTerm.app`, it automatically uses the iTerm2 provider.

**Example Output:**
```json
{
  "iterm": {
    "session_id": "w0t0p0:ABC123",
    "profile": "Default",
    "tab_name": "agent-tracker",
    "window_name": "1. Development"
  }
}
```

#### iTerm2 Session ID Format

The session ID follows the format: `w{window}t{tab}p{pane}:{id}`

- `w0` = First window
- `t0` = First tab
- `p0` = First pane
- `ABC123` = Unique session identifier

This can be used for deep linking to specific iTerm2 sessions.

### Apple Terminal (macOS)

Basic support through generic provider.

**Captured Information:**
- Terminal program name
- LC_TERMINAL and LC_TERMINAL_VERSION

**Planned Improvements:**
- Tab name extraction via AppleScript
- Window name detection
- Session identification

### Other Terminals

For unsupported terminals, the generic provider captures basic information:

**Captured Information:**
- TTY path
- TERM environment variable
- Shell path
- Parent process ID
- Terminal program name (if available)
- Terminal session ID (if available)

## Terminal Provider System

### Provider Location

Terminal providers are located in:
```
scripts/hooks/providers/
```

### Available Providers

- `iterm2.sh` - iTerm2-specific provider
- `generic.sh` - Fallback provider for all terminals
- `template.sh` - Template for creating new providers

### Provider Selection

The hook scripts automatically select the appropriate provider based on environment variables:

```bash
if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
  # Use iTerm2 provider
  TERMINAL_PROVIDER_JSON=$(scripts/hooks/providers/iterm2.sh)
else
  # Use generic provider
  TERMINAL_PROVIDER_JSON=$(scripts/hooks/providers/generic.sh)
fi
```

## Adding Support for New Terminals

To add support for a new terminal emulator:

### 1. Create a Provider Script

Copy the template:

```bash
cp scripts/hooks/providers/template.sh scripts/hooks/providers/mynewterm.sh
chmod +x scripts/hooks/providers/mynewterm.sh
```

### 2. Implement the Provider

Edit `mynewterm.sh` to extract terminal-specific information:

```bash
#!/bin/bash
# Provider for MyNewTerm terminal emulator

set -euo pipefail

# Extract terminal-specific information
# Use terminal-specific commands, APIs, or environment variables

SESSION_ID="${MYNEWTERM_SESSION_ID:-unknown}"
TAB_NAME="$(mynewterm get-tab-name 2>/dev/null || echo 'unknown')"
WINDOW_NAME="$(mynewterm get-window-name 2>/dev/null || echo 'unknown')"
PROFILE="${MYNEWTERM_PROFILE:-unknown}"

# Output as JSON
jq -n \
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
```

### 3. Add Provider Detection

Update `session-start.sh` and `session-end.sh` to detect your terminal:

```bash
if [[ "$TERM_PROGRAM" == "MyNewTerm" ]]; then
  TERMINAL_PROVIDER_JSON=$("${SCRIPT_DIR}/providers/mynewterm.sh")
elif [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
  TERMINAL_PROVIDER_JSON=$("${SCRIPT_DIR}/providers/iterm2.sh")
else
  TERMINAL_PROVIDER_JSON=$("${SCRIPT_DIR}/providers/generic.sh")
fi
```

### 4. Test the Provider

Test your provider in isolation:

```bash
./scripts/hooks/providers/mynewterm.sh
```

Then test the full hook:

```bash
echo '{"session_id":"test","cwd":"/tmp","transcript_path":"/tmp/test.json"}' | \
  scripts/hooks/session-start.sh

cat ~/.agent-tracker/sessions.jsonl | jq '.terminal.iterm' # Or your provider's key
```

## Planned Terminal Support

We plan to add first-class support for:

### Alacritty

**Status:** Planned

**Approach:** Parse Alacritty config and window title

### Kitty

**Status:** Planned

**Approach:** Use Kitty remote control protocol

### WezTerm

**Status:** Planned

**Approach:** Query WezTerm via CLI API

### Windows Terminal

**Status:** Planned

**Approach:** Use Windows Terminal settings and APIs

### tmux/screen Integration

**Status:** Planned

**Approach:** Detect tmux/screen sessions and capture pane/window info

## Environment Variables

Terminal providers can use these environment variables:

### Standard Variables
- `TTY` - Terminal device path
- `TERM` - Terminal type
- `SHELL` - Current shell
- `PPID` - Parent process ID

### Terminal-Specific Variables
- `TERM_PROGRAM` - Terminal program name
- `TERM_SESSION_ID` - Terminal session identifier
- `LC_TERMINAL` - Terminal name (macOS)
- `LC_TERMINAL_VERSION` - Terminal version (macOS)

### iTerm2-Specific Variables
- `ITERM_SESSION_ID` - iTerm2 session identifier
- `ITERM_PROFILE` - Active profile name

## Performance Considerations

### iTerm2 AppleScript Performance

The iTerm2 provider uses AppleScript which adds ~400ms latency to session hooks. This is acceptable for session start/end events but not ideal for high-frequency operations.

**Future Optimization:**

We plan to move iTerm2 integration from hooks to the TUI as a persistent background service. See [issue agent-tracker-28](https://github.com/wakeless/agent-tracker/issues) for details.

Benefits:
- Blazing fast hooks (~50ms vs 400ms)
- Real-time updates when tab names change
- Richer metadata from iTerm2 Python API

## Contributing

We welcome contributions for new terminal providers! Please:

1. Test your provider thoroughly on the target terminal
2. Follow the existing provider structure
3. Handle errors gracefully with fallbacks to "unknown"
4. Document any special requirements or dependencies
5. Submit a pull request with examples

## Next Steps

- [Learn about Claude Code integration](./claude-code)
- [See what's planned for the future](./roadmap)
