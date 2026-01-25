# Hook Scripts Development Guide

This directory contains the Claude Code hooks that capture session events for Agent Tracker.

## Backwards Compatibility

**CRITICAL**: The JSONL event format in `~/.agent-tracker/sessions.jsonl` is a public contract. Any changes MUST maintain backwards compatibility.

### Event Format Rules

1. **Never remove or rename top-level fields** - Existing consumers depend on them
2. **Never nest existing top-level fields** - Fields like `session_id`, `cwd`, `transcript_path` must remain at the top level
3. **Always add new fields, never restructure existing ones** - Additive changes only
4. **Preserve data types** - Don't change string to number, object to array, etc.

### Hook Data Integration

When integrating data from Claude hooks:
- **DO**: Merge all hook payload fields at the top level using `jq '. + {...}'`
- **DO**: Add enrichments (terminal, docker, git) as new top-level fields
- **DON'T**: Wrap hook data in a nested object like `hook_data: {...}`
- **DON'T**: Remove or restructure existing fields

### Example - Correct Approach

```bash
# Merge hook data at top level, add enrichments
EVENT=$(echo "$HOOK_DATA" | jq -c \
  --arg captured_at "$TIMESTAMP" \
  '. + {
    event_type: "session_start",
    terminal: {...},
    captured_at: $captured_at
  }')
```

Result: All hook fields remain at top level, enrichments added alongside:
```json
{
  "session_id": "...",           // From hook (top level)
  "cwd": "...",                  // From hook (top level)
  "hook_event_name": "...",      // From hook (top level)
  "event_type": "session_start", // Our addition (top level)
  "terminal": {...},             // Our enrichment
  "captured_at": "..."           // Our addition
}
```

### Example - Incorrect Approach

```bash
# WRONG: Nesting hook data breaks backwards compatibility
EVENT=$(jq -nc \
  --argjson hook_data "$HOOK_DATA" \
  '{ hook_data: $hook_data, terminal: {...} }')
```

Result: Existing code reading `event.session_id` breaks:
```json
{
  "hook_data": {              // Nested - breaks existing code!
    "session_id": "...",
    "cwd": "..."
  },
  "terminal": {...}
}
```

## Testing Hooks

### Manual Testing

Test hooks manually without starting Claude:

```bash
# Test session-start hook
echo '{"session_id":"test-123","cwd":"/tmp","transcript_path":"/tmp/test.json"}' | \
  scripts/hooks/session-start.sh

# Test session-end hook
echo '{"session_id":"test-123","cwd":"/tmp","transcript_path":"/tmp/test.json"}' | \
  scripts/hooks/session-end.sh

# Check output
tail -1 ~/.agent-tracker/sessions.jsonl | jq .
```

### Integration Testing

**Critical**: Do NOT test hooks from within a Claude session. Running `claude` from within Claude creates nested sessions that may not trigger hooks properly.

```bash
# Terminal 1: Monitor events in real-time
tail -f ~/.agent-tracker/sessions.jsonl

# Terminal 2: From a REGULAR terminal (not inside Claude)
cd demo-repo && claude "test prompt"
```

### Debug Logging

Add temporary debug logging to verify hooks are being called:

```bash
# Add to the top of session-start.sh (after set -euo pipefail)
echo "[$(date)] Hook called" >> "$HOME/.agent-tracker/debug.log" 2>&1 || true
```

Then check the debug log:

```bash
tail -f ~/.agent-tracker/debug.log
```

## Debugging Plugin Hooks

### Issue: Hooks Not Firing

If the SessionStart/SessionEnd hooks aren't firing and no events are being written to `~/.agent-tracker/sessions.jsonl`:

#### 1. Validate Plugin Configuration

```bash
claude plugin validate .claude-plugin/plugin.json
```

Common validation errors:
- **author field**: Must be an object with `name` property, not a string
- **hooks path**: Must start with `./`

#### 2. Add Marketplace and Verify Installation

```bash
# From the agent-tracker directory
claude plugin marketplace add .
claude plugin marketplace list
```

You should see `agent-tracker` listed with source as "Directory".

#### 3. Enable the Plugin

Enable in `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "agent-tracker@agent-tracker": true
  }
}
```

#### 4. Plugin Hooks Configuration Structure

The `.claude-plugin/hooks/hooks.json` file must have this **exact structure**:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-start.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Critical requirements**:
- Top-level `"hooks"` wrapper object
- `"matcher"` field for each event (empty string matches all)
- `${CLAUDE_PLUGIN_ROOT}` variable points to repository root

#### 5. Known Limitation: SessionEnd Hooks

SessionEnd hooks defined in plugin manifests may not fire reliably.

**Workaround**: Add SessionEnd hooks directly to `~/.claude/settings.json` with **absolute paths**.

#### 6. Verify Event Data

```bash
# Count event types
cat ~/.agent-tracker/sessions.jsonl | jq -s 'group_by(.event_type) | map({type: .[0].event_type, count: length})'

# View recent events
tail -5 ~/.agent-tracker/sessions.jsonl | jq .
```

## Common Issues

1. **Hooks silently failing**: Check script permissions (`chmod +x scripts/hooks/*.sh`)
2. **jq not found**: Ensure jq is installed
3. **No events written**: Verify `~/.agent-tracker/` directory exists and is writable
4. **Nested session issue**: Always test from a fresh terminal, not from within Claude

## References

- [Claude Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks.md)
- [Claude Plugins Reference](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)
- [Terminal Providers](./providers/README.md)
