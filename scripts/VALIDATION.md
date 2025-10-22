# Work Summary Validation

This document describes how to validate that the work summary MCP integration is working correctly.

## Quick Validation

Run the validation script to check all sessions:

```bash
npm run validate:work-summary
```

This will show:
- All sessions with their status (active/ended)
- Activity event counts and MCP tool call counts
- Whether work summaries are set
- Summary statistics

## Detailed Session Inspection

To see the full work summary history for a specific session:

```bash
npm run validate:work-summary -- --session <session-id> --verbose
```

Example output:
```
Session: 26286a58-c1e2-44c6-b6e2-f86cb90836b0
Status: ✕ Ended | Duration: 11m
Activity Events: 53 | MCP Calls: 6

✅ Current Work Summary: "Building validation script for work summary"

Work Summary History (1 updates):
  1. [2:46:20 pm] "Building validation script for work summary"
```

## Manual Event Inspection

### Check raw events in JSONL file

```bash
# See all work summary MCP calls
grep "set_work_summary" ~/.agent-tracker/sessions.jsonl | jq '.'

# See only calls with tool_input captured
grep "set_work_summary" ~/.agent-tracker/sessions.jsonl | jq 'select(.tool_input != null)'

# Count MCP calls by session
grep "set_work_summary" ~/.agent-tracker/sessions.jsonl | \
  jq -r '.session_id' | sort | uniq -c
```

### Verify event structure

A correctly captured work summary event should look like this:

```json
{
  "event_type": "activity",
  "activity_type": "tool_use",
  "session_id": "26286a58-c1e2-44c6-b6e2-f86cb90836b0",
  "timestamp": "2025-10-22T03:46:20.495Z",
  "hook_event_name": "PostToolUse",
  "tool_name": "mcp__plugin_agent-tracker_agent-tracker__set_work_summary",
  "tool_input": {
    "summary": "Building validation script for work summary"
  }
}
```

**Key fields:**
- `tool_name` must be exactly `mcp__plugin_agent-tracker_agent-tracker__set_work_summary`
- `tool_input.summary` must contain the work summary string
- `hook_event_name` should be `PostToolUse`

## Troubleshooting

### Issue: MCP calls detected but `tool_input` is missing

**Symptom:** Events have `tool_name` but no `tool_input` field

**Cause:** The PostToolUse hook payload doesn't include tool parameters

**Fix:** Check that Claude Code version supports `tool_input` in PostToolUse hooks. This may require a Claude Code update.

### Issue: No MCP calls detected at all

**Symptom:** `Total MCP set_work_summary calls: 0`

**Possible causes:**
1. Plugin instructions not loaded
2. MCP server not installed/configured
3. Agent not following instructions

**Debug steps:**

```bash
# 1. Verify MCP server is configured
cat .claude-plugin/plugin.json | jq '.mcpServers'

# 2. Check plugin is enabled
cat ~/.claude/settings.json | jq '.enabledPlugins'

# 3. Verify MCP server is runnable
node mcp/dist/index.js

# 4. Check plugin instructions exist
cat .claude-plugin/instructions.md
```

### Issue: Work summary not displayed in TUI

**Symptom:** Events captured but SessionDetail doesn't show work summary

**Check:**

1. Tool name matches exactly in `SessionTrackerService.ts`:
   ```typescript
   event.tool_name === 'mcp__plugin_agent-tracker_agent-tracker__set_work_summary'
   ```

2. TypeScript is built:
   ```bash
   npm run build
   ```

3. TUI is using latest build:
   ```bash
   # Restart TUI
   npm run dev
   ```

## Expected Behavior

When working correctly:
- Every `set_work_summary` call creates an activity event with `tool_input.summary`
- The `SessionTrackerService` detects these events and dispatches `UPDATE_WORK_SUMMARY`
- The `ActivityStore` updates `session.workSummary`
- The `SessionDetail` component displays the summary in magenta italic text
- The `SessionList` component displays summaries in dimmed italic text

## Feedback Loop

To create a full feedback loop during development:

1. **Terminal 1:** Run the TUI
   ```bash
   npm run dev
   ```

2. **Terminal 2:** Monitor events
   ```bash
   tail -f ~/.agent-tracker/sessions.jsonl | jq 'select(.tool_name != null)'
   ```

3. **Terminal 3:** Work in Claude Code
   ```bash
   cd demo-repo && claude
   ```

4. **After session ends:** Validate
   ```bash
   npm run validate:work-summary -- --session <session-id> --verbose
   ```
