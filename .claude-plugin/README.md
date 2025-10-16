# Agent Tracker Claude Plugin

This Claude Code plugin captures session start and end events to enable tracking of active Claude instances.

## Features

- Captures session start events when Claude begins
- Captures session end events when Claude terminates
- Records session metadata:
  - Session ID
  - Working directory
  - Transcript path
  - Terminal information (TTY, TERM, shell, process info)
  - Terminal program and session identifiers
  - Timestamps

## Installation

### Option 1: Local Plugin (Development)

For development and testing in this repository:

```bash
# The plugin is already in .claude-plugin/ and will be auto-loaded
# when running Claude in this directory
```

### Option 2: Install for Demo Repo

To test with the demo-repo:

```bash
# Copy plugin to demo-repo
cp -r .claude-plugin demo-repo/

# Or create a symlink
ln -s "$(pwd)/.claude-plugin" demo-repo/.claude-plugin
```

### Option 3: Global Installation

To use the plugin in any directory:

```bash
# Install to user plugins directory
mkdir -p ~/.claude/plugins
cp -r .claude-plugin ~/.claude/plugins/agent-tracker
```

## Data Output

Events are written to `~/.agent-tracker/sessions.jsonl` in JSONL format.

### Event Schema

**Session Start Event:**
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
    "term_session_id": "unique-session-id"
  },
  "timestamp": "2025-10-16T02:31:52Z"
}
```

**Session End Event:**
```json
{
  "event_type": "session_end",
  "session_id": "abc123",
  ...
}
```

## Testing

Test the hooks manually:

```bash
# Test session-start hook
echo '{"session_id":"test-123","cwd":"/tmp","transcript_path":"/tmp/test.json"}' | \
  .claude-plugin/hooks/session-start.sh

# Test session-end hook
echo '{"session_id":"test-123","cwd":"/tmp","transcript_path":"/tmp/test.json"}' | \
  .claude-plugin/hooks/session-end.sh

# Check output
cat ~/.agent-tracker/sessions.jsonl | jq .
```

## Integration with Agent Tracker TUI

The Agent Tracker TUI monitors the JSONL file and displays active sessions in real-time.

## Troubleshooting

### Hooks not firing

1. Check that the plugin is in a location Claude can find:
   - Local: `.claude-plugin/` in project directory
   - Global: `~/.claude/plugins/agent-tracker/`

2. Verify hook scripts are executable:
   ```bash
   chmod +x .claude-plugin/hooks/*.sh
   ```

3. Check for errors in debug log:
   ```bash
   tail -f ~/.agent-tracker/debug.log
   ```

### No events in JSONL file

1. Verify `jq` is installed: `which jq`
2. Check permissions on `~/.agent-tracker/` directory
3. Run hooks manually with test data to verify they work

## Architecture Decision

This plugin uses **JSONL file-based communication** rather than named pipes because:
- More robust - works even if TUI isn't running
- Persistent - events aren't lost
- Simpler - no need to manage pipe connections
- Replayable - can process historical events
- Multi-reader friendly - multiple tools can read the same log
