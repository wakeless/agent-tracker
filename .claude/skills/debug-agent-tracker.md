---
description: Debug Agent Tracker session tracking issues with a systematic diagnostic workflow
proactive: false
---

# Debug Agent Tracker

You are helping debug Agent Tracker session tracking issues. Use this systematic workflow to diagnose problems.

## Overview

Agent Tracker tracks Claude Code sessions via hooks that write events to `~/.agent-tracker/sessions.jsonl`. The TUI reads this file and displays sessions in real-time.

## Quick Diagnosis Workflow

When a session isn't showing up or behaving correctly, follow these steps:

### Step 1: Check if Events are Being Written

First, verify that events are being captured:

```bash
# Watch for new events in real-time
tail -f ~/.agent-tracker/sessions.jsonl
```

**Expected**: You should see JSON events appearing as Claude activity happens.

**If no events appear**:
- Hooks may not be installed or enabled
- Check `.claude/settings.json` for enabled plugins
- Verify plugin installation with `claude plugin list`

### Step 2: View Event Timeline for the Session

Check the chronological sequence of events:

```bash
# View timeline for specific session
npm run debug:timeline -- --session-id <SESSION_ID> --limit 30

# Or filter by project directory
npm run debug:timeline -- --cwd /path/to/project
```

**Look for:**
- ✓ `session_start` event exists
- ✓ Activity events (tool_use, prompt_submit, stop)
- ⚠️ `session_end` followed by more activity → **Session was re-opened**
- ⚠️ Large gaps in activity → **Hooks may have stopped firing**
- ⚠️ No `session_start` → **Hook didn't fire on session start**

**Common patterns:**
```
12:30:48  session_start
12:31:15  tool_use              Read
12:45:54  session_end
12:50:15  tool_use              Read    ← Activity after end = reopened session
```

### Step 3: Check Current Session State

View exactly what the TUI sees:

```bash
# View specific session state
npm run debug:sessions -- --session-id <SESSION_ID>

# View all sessions
npm run debug:sessions
```

**Key fields to check:**

```json
{
  "status": "active",           // Should be "active" for running sessions
  "isPhantom": false,            // Should be false for real sessions
  "awaitingInput": true,         // True = waiting for user, false = Claude working
  "lastActivityTime": "...",     // Should match recent activity
  "endTime": null,               // Should be null/undefined for active sessions
  "workSummary": "..."           // Current work description
}
```

### Step 4: Diagnose Common Issues

#### Issue: Session showing as "ended" but is still active

**Symptoms:**
- Timeline shows activity after `session_end`
- Session state shows `status: "ended"`

**Cause:** Session was ended and then re-opened. Activity events should re-activate the session.

**Fix:** Session re-activation logic should handle this automatically (fixed in recent versions). If not working, check ActivityStore reducer.

#### Issue: Session marked as phantom (`isPhantom: true`)

**Symptoms:**
- Session exists but doesn't appear in TUI
- `isPhantom: true` in session state

**Cause:** Transcript file appears to be a phantom (very small, not modified after creation)

**Check:**
```bash
# Check transcript file size and times
ls -lh ~/.claude/projects/.../SESSION_ID.jsonl
stat -f "size=%z birthtime=%SB mtime=%Sm" ~/.claude/projects/.../SESSION_ID.jsonl
```

**Criteria for phantom:**
- File size < 50KB AND
- Modified time - birth time < 60 seconds

#### Issue: Missing session (not in output at all)

**Symptoms:**
- No session found in `debug:sessions` output
- Timeline shows no events for session

**Debugging steps:**
1. Check if session_start event was written to sessions.jsonl
2. Verify hooks are enabled for this project
3. Check if session was started before hooks were installed
4. Look for errors in hook scripts

#### Issue: `lastActivityTime` is old but timeline shows recent activity

**Symptoms:**
- Timeline has recent events
- Session state shows old `lastActivityTime`

**Cause:** Activity events aren't updating session state, or transcript polling isn't working

**Check:**
- Are activity events being dispatched to ActivityStore?
- Is transcript polling enabled in App.tsx?

## Debug Tool Reference

### `npm run debug:sessions`

**Purpose:** Dump current session state as JSON

**Options:**
- `--session-id <id>` - View single session
- `--format pretty|compact` - Output formatting (default: pretty)
- `--no-counts` - Exclude session counts
- `--no-stats` - Exclude activity statistics

**Output includes:**
- All session metadata
- Session status and states
- Activity counts and statistics
- Recent activity events

### `npm run debug:timeline`

**Purpose:** Show chronological event timeline

**Options:**
- `--session-id <id>` - Filter by session
- `--cwd <path>` - Filter by project directory
- `--limit <n>` - Number of events to show (default: 50)
- `--format table|json` - Output format (default: table)

**Event types shown:**
- `session_start` - Session began
- `session_end` - Session ended
- `tool_use` - Claude used a tool (shows tool name)
- `prompt_submit` - User submitted input
- `stop` - Claude finished responding
- `notification` - System notification
- `subagent_stop` - Subagent finished

## Advanced Debugging

### Check Raw Event Structure

If you need to see the exact event format:

```bash
# View specific event types
grep "session_start" ~/.agent-tracker/sessions.jsonl | tail -1 | jq .

# View events for a session
grep "SESSION_ID" ~/.agent-tracker/sessions.jsonl | jq .
```

### Test Hook Installation

Create a test session to verify hooks fire:

```bash
# In a separate terminal
cd /tmp && claude "echo test"
```

Check if events appear in `~/.agent-tracker/sessions.jsonl`.

### Monitor in Real-Time

Set up multi-terminal debugging:

**Terminal 1:** Run Agent Tracker TUI
```bash
npm run dev
```

**Terminal 2:** Watch events
```bash
tail -f ~/.agent-tracker/sessions.jsonl
```

**Terminal 3:** Start test Claude session
```bash
claude "list files"
```

You should see events in Terminal 2 and session in Terminal 1 immediately.

## Key Architecture Points

- **Redux-style state**: ActivityStore uses pure reducers
- **Event-driven**: Everything flows from JSONL events
- **Session re-activation**: Activity events re-activate ended sessions
- **Phantom detection**: Based on transcript file size and timestamps
- **Transcript polling**: Fallback for when hooks don't fire

## Quick Fixes

### Hooks not firing
```bash
# Reinstall plugin
claude plugin uninstall agent-tracker
claude plugin install agent-tracker
```

### Session state incorrect
```bash
# Check if ActivityStore reducer is handling events
npm run debug:timeline -- --session-id <ID>
npm run debug:sessions -- --session-id <ID>
# Compare timestamps - should match
```

### Phantom session issue
Check transcript file - if it's actually large and actively used, the phantom detection threshold may need adjustment in ActivityStore.ts:50.

## When to Escalate

If after following this workflow you can't identify the issue:

1. Gather diagnostics:
   ```bash
   npm run debug:sessions -- --format compact > session-state.json
   npm run debug:timeline -- --session-id <ID> --format json > timeline.json
   ```

2. Check for console errors in the TUI

3. Review recent changes to ActivityStore, SessionTrackerService, or event processing

4. File an issue with diagnostics attached
