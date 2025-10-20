---
sidebar_position: 2
---

# Claude Code Integration

Agent Tracker integrates with Claude Code through a plugin system that captures session events in real-time.

## Overview

The Claude Code plugin installs hooks that fire when:
- A Claude session starts
- A Claude session ends
- Activity occurs (tool usage, prompts, user input requests)

These events are written to `~/.agent-tracker/sessions.jsonl` where the TUI reads them in real-time.

## Installation

### Step 1: Add the Plugin Marketplace

From within the `agent-tracker` repository directory, run these commands in a Claude session:

```bash
# Add this repository as a plugin marketplace
/plugin marketplace add .

# Verify it was added
/plugin marketplace list
```

You should see `agent-tracker` listed as a marketplace with source "Directory".

### Step 2: Install the Plugin

```bash
# Install the agent-tracker plugin
/plugin install agent-tracker

# Verify it's installed and enabled
/plugin list
```

The plugin should appear in your enabled plugins list.

### Step 3: Restart Claude Sessions

**Important**: After installing the plugin, you need to restart any running Claude sessions (or start new ones) for the hooks to become active. The current session won't have the hooks loaded.

## How It Works

### Event Capture

The plugin uses Claude Code's hook system to capture events:

#### SessionStart Hook

Fires when a Claude session begins, capturing:
- Session ID
- Working directory (cwd)
- Transcript path
- Terminal information (TTY, shell, term program)
- Git repository info (branch, repo name, dirty state)
- Docker container detection

#### SessionEnd Hook

Fires when a Claude session terminates, recording the end time.

#### Activity Hooks

Fire during session activity:
- **ToolUse**: When Claude uses a tool (Read, Write, Bash, etc.)
- **PromptSubmit**: When the user submits a prompt
- **Stop**: When Claude finishes responding
- **Notification**: When Claude requests user input or permissions

### Event Storage

All events are written to:
```
~/.agent-tracker/sessions.jsonl
```

This is a JSON Lines file where each line is a complete event object. The TUI watches this file and updates the display in real-time.

### Terminal Providers

The plugin includes modular terminal providers that extract terminal-specific information:

#### iTerm2 Provider

When running in iTerm2, the plugin captures:
- Tab name
- Window name
- Profile name
- Session ID

#### Generic Provider

For other terminals, provides basic terminal information.

See [Terminal Support](./terminal-support) for more details on terminal providers.

## Testing the Installation

### Verify Events Are Being Written

Monitor the JSONL file in real-time:

```bash
tail -f ~/.agent-tracker/sessions.jsonl
```

### Test with a Quick Session

In a separate terminal:

```bash
cd /tmp
claude "this is a test prompt"
```

You should see a `session_start` event immediately in the tail output, followed by activity events, and finally a `session_end` event when the prompt completes.

### View in the TUI

Run the Agent Tracker TUI:

```bash
agent-tracker
```

Start a new Claude session in another terminal and watch it appear in the session list.

## Troubleshooting

### Hooks Not Firing

If events aren't being written to the JSONL file:

1. **Validate Plugin Configuration**:
   ```bash
   claude plugin validate .claude-plugin/plugin.json
   ```

2. **Check Plugin is Enabled**:
   - Open `~/.claude/settings.json`
   - Verify `enabledPlugins` includes `"agent-tracker@agent-tracker": true`

3. **Restart Claude Sessions**: The current session won't have hooks - start a fresh session

4. **Check Debug Logs**:
   ```bash
   tail -f ~/.agent-tracker/debug.log
   ```

### SessionEnd Hook Not Working

There's a known limitation where SessionEnd hooks defined in plugin manifests may not fire reliably. As a workaround, add the SessionEnd hook directly to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/agent-tracker/scripts/hooks/session-end.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Use absolute paths when defining hooks in settings.json.

### No Events in JSONL File

1. **Verify jq is installed**: `which jq`
   - macOS: `brew install jq`
   - Linux: `apt install jq` or `yum install jq`

2. **Check Permissions**: Verify `~/.agent-tracker/` directory exists and is writable

3. **Test Hooks Manually**:
   ```bash
   echo '{"session_id":"test-123","cwd":"/tmp","transcript_path":"/tmp/test.json"}' | \
     scripts/hooks/session-start.sh

   cat ~/.agent-tracker/sessions.jsonl | jq .
   ```

## Event Schema

### Session Start Event

```json
{
  "event_type": "session_start",
  "session_id": "abc123",
  "cwd": "/path/to/working/directory",
  "transcript_path": "/path/to/transcript.json",
  "terminal": {
    "tty": "/dev/ttys001",
    "term": "xterm-256color",
    "shell": "/bin/zsh",
    "ppid": "12345",
    "term_program": "iTerm.app",
    "term_session_id": "unique-session-id",
    "iterm": {
      "session_id": "w0t0p0:ABC123",
      "profile": "Default",
      "tab_name": "agent-tracker",
      "window_name": "1. Development"
    }
  },
  "git": {
    "is_repo": true,
    "branch": "main",
    "is_worktree": false,
    "is_dirty": false,
    "repo_name": "agent-tracker"
  },
  "docker": {
    "is_container": false,
    "container_id": "",
    "container_name": ""
  },
  "timestamp": "2025-10-16T02:31:52Z"
}
```

### Activity Event

```json
{
  "event_type": "activity",
  "activity_type": "tool_use",
  "session_id": "abc123",
  "tool_name": "Read",
  "timestamp": "2025-10-16T02:32:15Z"
}
```

## Configuration

### Custom Events File

You can specify a custom events file path:

```bash
agent-tracker --events-file /tmp/test-sessions.jsonl
```

This is useful for:
- Testing without affecting your real sessions
- Running multiple independent instances
- Isolating test sessions

## Next Steps

- [Learn about terminal support](./terminal-support)
- [See what's planned for future agents](./roadmap)
