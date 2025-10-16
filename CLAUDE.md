This is a TypeScript CLI TUI written using Ink (React for CLIs).

## Development Guidelines

As an LLM agent working on this project:

1. **Complete Work**: Do not finish until your TODO list or acceptance criteria are complete
2. **TDD Loop**: Work iteratively with Test-Driven Development
3. **Feedback Loop**: Always create and utilize feedback loops to ensure code is workable
4. **Architecture**: Follow the patterns documented in [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Redux pattern for state management
   - Provider pattern for terminal detection
   - Event-driven architecture
   - Type-safe discriminated unions

## Technical Reference

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system architecture, design patterns, and extension points
- **[README.md](./README.md)** - User-facing documentation and features
- **[scripts/hooks/providers/README.md](./scripts/hooks/providers/README.md)** - Terminal provider system

## React/Ink Guidelines

### Key Props
The "Each child in a list should have a unique key prop" warning is **only relevant** when:
- Iterating over arrays with `.map()`
- Rendering dynamic lists of components
- Components that may reorder, add, or remove items

**Do NOT add keys to:**
- Static, non-iterating JSX elements
- Single conditional renders (`condition && <Component />`)
- Static sibling elements that don't change order

**Example - Keys Required:**
```tsx
{items.map((item) => (
  <DetailRow key={item.id} label={item.label} value={item.value} />
))}
```

**Example - Keys NOT Required:**
```tsx
<DetailRow label="Session ID" value={session.id} />
<DetailRow label="Working Directory" value={session.cwd} />
{/* These are static, no iteration, no keys needed */}
```

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

### 3. Enable the Plugin

Enable the plugin in `~/.claude/settings.json`:

```json
{
  "enabledPlugins": {
    "agent-tracker@agent-tracker": true
  }
}
```

### 4. Plugin Hooks Configuration Structure

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
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-end.sh",
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
- Paths are relative to `${CLAUDE_PLUGIN_ROOT}`

The plugin.json must reference the hooks file with a path relative to the repository root:

```json
{
  "hooks": "./.claude-plugin/hooks/hooks.json"
}
```

### 5. Known Limitation: SessionEnd Hooks

**Issue**: SessionEnd hooks defined in plugin manifests (`.claude-plugin/hooks/hooks.json`) may not fire reliably, even though SessionStart hooks work.

**Workaround**: Add SessionEnd hooks directly to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/michaelgall/Development/agent-tracker/scripts/hooks/session-end.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Use **absolute paths** when defining hooks in settings.json.

### 6. Test Hooks Properly

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

### 7. Add Debug Logging

Add temporary debug logging to verify hooks are being called:

```bash
# Add to the top of session-start.sh (after set -euo pipefail)
echo "[$(date)] Hook called" >> "$HOME/.agent-tracker/debug.log" 2>&1 || true
```

Then check the debug log:

```bash
tail -f ~/.agent-tracker/debug.log
```

### 8. Verify Event Data

Check that events are being written correctly:

```bash
# Count event types
cat ~/.agent-tracker/sessions.jsonl | jq -r '.event_type' | sort | uniq -c

# View recent events with formatting
tail -5 ~/.agent-tracker/sessions.jsonl | jq '.'
```

You should see both `session_start` and `session_end` events with proper session IDs and timestamps.

## Common Issues

1. **Hooks silently failing**: Check hook script permissions (`chmod +x scripts/hooks/*.sh`)
2. **jq not found**: Install jq (`brew install jq` on macOS)
3. **No events written**: Verify `~/.agent-tracker/` directory exists and is writable
4. **Nested session issue**: Always test from a fresh terminal, not from within Claude
