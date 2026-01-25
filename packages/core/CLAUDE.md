# Core Package

This package contains shared business logic for Agent Tracker, including session tracking, transcript parsing, and state management.

## Dual Tracking Architecture

Agent Tracker uses **two complementary tracking mechanisms** that work together cohesively:

### 1. Hook-based Tracking (SessionTrackerService)

**Components**: `EventWatcher` + `ActivityStore`

- Watches `~/.agent-tracker/sessions.jsonl` for real-time hook events
- Provides immediate session start/end/activity notifications
- Requires Claude hooks to be configured (see `/scripts/hooks/`)
- Best for: Real-time updates, activity tracking, notification handling

**Data Flow**:
```
Claude hooks → sessions.jsonl → EventWatcher → dispatch(action) → ActivityStore → subscribers
```

**Usage**:
```typescript
import { SessionTrackerService } from '@agent-tracker/core';

const tracker = new SessionTrackerService({
  eventsFilePath: '~/.agent-tracker/sessions.jsonl',
});
tracker.start();
tracker.subscribe(() => {
  const sessions = tracker.getSessions();
  // Update UI
});
```

### 2. File System Tracking (ExploreTrackerService)

**Components**: `ProjectScanner` + `TranscriptWatcher`

- Scans `~/.claude/projects/` for session metadata
- Discovers sessions even without hooks configured
- Reads transcript files for activity detection
- Best for: Session discovery, historical data, fallback when hooks unavailable

**Data Flow**:
```
~/.claude/projects/ → ProjectScanner → session index → TranscriptWatcher → state updates
```

**Usage**:
```typescript
import { ExploreTrackerService } from '@agent-tracker/core';

const tracker = new ExploreTrackerService({
  projectsDir: '~/.claude/projects',
});
await tracker.start();
const sessions = tracker.getSessions();
```

## When to Use Which Service

| Scenario | Recommended Service |
|----------|-------------------|
| TUI real-time updates | SessionTrackerService |
| Web dashboard discovery | ExploreTrackerService |
| Hooks not configured | ExploreTrackerService |
| Activity notifications | SessionTrackerService |
| Historical transcript viewing | Either (both access transcripts) |

## Future Consideration

A unified `TrackerService` could combine both mechanisms:
- Use hooks for real-time events when available
- Fall back to file system scanning for discovery
- Merge session data from both sources

## Key Types

- `Session` - Core session data structure
- `SessionStatus` - 'active' | 'inactive' | 'ended'
- `SessionEvent` - Hook event types (session_start, session_end, activity)
- `TranscriptEntry` - Parsed transcript message

## Services

- `ActivityStore` - Redux-style state management for sessions
- `EventWatcher` - Watches JSONL file for hook events
- `SessionTrackerService` - Combines EventWatcher + ActivityStore
- `ExploreTrackerService` - File system based session discovery
- `ProjectScanner` - Scans ~/.claude/projects for sessions
- `TranscriptReader` - Parses transcript JSONL files
- `TranscriptWatcher` - Watches transcript files for changes
