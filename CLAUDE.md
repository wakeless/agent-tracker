This is an typescript CLI TUI written utilising Ink.

As an LLM agent, you will not finish working until your TODO list or your acceptance criteria are completeAs.

You will also work iteratively with a TDD loop. You should always create and utilise a feedback loop to ensure that what you are building is always workable.

# Debugging and Monitoring

To debug and monitor the Agent Tracker plugin:

## Monitor Session Events

Watch the JSONL file in real-time to see events as they arrive:
```bash
tail -f ~/.agent-tracker/sessions.jsonl
```

## Validate Events Are Being Received

Test that hooks are firing by starting a new Claude session:
```bash
cd demo-repo && claude
```

Or run a quick test with a one-off prompt:
```bash
cd demo-repo && claude "this is a test prompt"
```

Both commands will trigger the SessionStart hook and write an event to the JSONL file. The second command will also trigger SessionEnd when the prompt completes.

## Full Testing Workflow

1. Terminal 1: Start the Agent Tracker TUI
   ```bash
   npm run dev
   ```

2. Terminal 2: Monitor the event log
   ```bash
   tail -f ~/.agent-tracker/sessions.jsonl
   ```

3. Terminal 3: Start a test Claude session
   ```bash
   cd demo-repo && claude "list files in this directory"
   ```

You should see the session appear in the TUI and events logged in terminal 2.

# Important references

[Claude Hooks](https://docs.claude.com/en/docs/claude-code/hooks.md)
[Claude Plugins](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)
[Claude plugin Marketplace](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces.md)

# Debugging Plugin Hooks

## Issue: Hooks Not Firing

If the SessionStart/SessionEnd hooks aren't firing and no events are being written to `~/.agent-tracker/sessions.jsonl`, follow these debugging steps:

### 1. Validate Plugin Configuration

Check that `plugin.json` validates correctly:

```bash
claude plugin validate .claude-plugin/plugin.json
```

Common validation errors:
- **author field**: Must be an object with `name` property, not a string
  ```json
  "author": {
    "name": "Agent Tracker Team"
  }
  ```
- **hooks path**: Must start with `./`
  ```json
  "hooks": "./hooks/hooks.json"
  ```

### 2. Add Marketplace and Verify Installation

Add the plugin marketplace:

```bash
# From the agent-tracker directory
claude plugin marketplace add /Users/michaelgall/Development/agent-tracker
```

Verify it's installed:

```bash
claude plugin marketplace list
```

You should see `agent-tracker` listed with source as "Directory".

### 3. Configure Hooks in Settings

**Important**: Plugin hooks defined in `.claude-plugin/hooks/hooks.json` may not load automatically. The reliable solution is to explicitly configure hooks in `.claude/settings.local.json`:

```json
{
  "enabledPlugins": {
    "agent-tracker@agent-tracker": true
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude-plugin/hooks/session-start.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/.claude-plugin/hooks/session-end.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Use **absolute paths** to the hook scripts, not relative paths.

### 4. Test Hooks Properly

**Critical**: Do NOT test hooks from within a Claude session. Running `claude` from within Claude creates nested sessions that may not trigger hooks properly.

Correct testing approach:

```bash
# Terminal 1: Monitor events in real-time
tail -f ~/.agent-tracker/sessions.jsonl

# Terminal 2: From a REGULAR terminal (not inside Claude)
cd /Users/michaelgall/Development/agent-tracker/demo-repo
claude "test prompt"
```

You should see a `session_start` event immediately in Terminal 1, followed by a `session_end` event when the session completes.

### 5. Add Debug Logging

Add temporary debug logging to verify hooks are being called:

```bash
# Add to the top of session-start.sh (after set -euo pipefail)
echo "[$(date)] Hook called" >> "$HOME/.agent-tracker/debug.log" 2>&1 || true
```

Then check the debug log:

```bash
tail -f ~/.agent-tracker/debug.log
```

### 6. Verify Event Data

Check that events are being written correctly:

```bash
# Count event types
cat ~/.agent-tracker/sessions.jsonl | jq -r '.event_type' | sort | uniq -c

# View recent events with formatting
tail -5 ~/.agent-tracker/sessions.jsonl | jq '.'
```

You should see both `session_start` and `session_end` events with proper session IDs and timestamps.

## Common Issues

1. **Hooks silently failing**: Check hook script permissions (`chmod +x .claude-plugin/hooks/*.sh`)
2. **jq not found**: Install jq (`brew install jq` on macOS)
3. **No events written**: Verify `~/.agent-tracker/` directory exists and is writable
4. **Nested session issue**: Always test from a fresh terminal, not from within Claude
