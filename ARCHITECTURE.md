# Agent Tracker Architecture

This document describes the technical architecture, design patterns, and implementation details of Agent Tracker.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [State Management](#state-management)
- [Terminal Provider System](#terminal-provider-system)
- [Event Schema](#event-schema)
- [Design Patterns](#design-patterns)
- [Testing Strategy](#testing-strategy)

## Overview

Agent Tracker is a CLI TUI tool built with TypeScript and Ink (React for CLIs) that tracks Claude Code sessions in real-time using a plugin-based hook system.

### Key Design Principles

1. **Event-Driven Architecture**: All changes flow through immutable events
2. **Redux Pattern**: Predictable state updates with pure reducer functions
3. **Modular Design**: Terminal providers are pluggable and extensible
4. **Type Safety**: Full TypeScript coverage with discriminated unions
5. **Real-Time Updates**: File watching with incremental reads for performance

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Claude Code Session                      │
└───────┬──────────────────┬──────────────────┬────────────────┘
        │                  │                  │
        │ SessionStart     │ PostToolUse      │ UserPromptSubmit
        │ SessionEnd       │ Stop             │
        ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
│ session-start.sh│  │ activity.sh  │  │   (other hooks)  │
└────────┬────────┘  └──────┬───────┘  └────────┬─────────┘
         │                  │                   │
         ├──────────────────┴───────────────────┤
         │      Call Terminal Provider          │
         ▼                                       │
┌──────────────────────┐                        │
│ Terminal Providers   │                        │
│  • iterm2.sh         │                        │
│  • generic.sh        │                        │
│  • (extensible...)   │                        │
└──────────┬───────────┘                        │
           │                                    │
           │ Terminal Metadata (JSON)           │
           └────────────────┬───────────────────┘
                            │
                            ▼
                   ┌────────────────────┐
                   │ ~/.agent-tracker/  │
                   │  sessions.jsonl    │
                   │ (Event Stream)     │
                   └────────┬───────────┘
                            │ fs.watch()
                            ▼
                   ┌────────────────────┐
                   │   EventWatcher     │
                   │ (Parse & Dispatch) │
                   └────────┬───────────┘
                            │
                            ▼
                   ┌────────────────────┐
                   │  ActivityStore     │
                   │ (Redux Reducer)    │
                   └────────┬───────────┘
                            │
                            ▼
                   ┌────────────────────┐
                   │   Agent Tracker    │
                   │  TUI (Ink/React)   │
                   └────────────────────┘
```

## Component Architecture

### 1. Hook Scripts Layer

**Location**: `scripts/hooks/`

#### session-start.sh / session-end.sh
- **Purpose**: Capture session lifecycle events
- **Input**: Claude hook data via stdin (JSON)
- **Process**:
  1. Parse hook data (session_id, cwd, transcript_path)
  2. Capture basic terminal info (tty, TERM, shell, PPID)
  3. Call appropriate terminal provider
  4. Merge provider data with base event
  5. Write to JSONL file
- **Output**: Session event to `~/.agent-tracker/sessions.jsonl`

#### activity.sh
- **Purpose**: Capture activity events (shared by multiple hooks)
- **Input**: Hook data including `hook_event_name` and `tool_name`
- **Process**:
  1. Map hook name to activity type
  2. Extract relevant metadata
  3. Create lightweight activity event
- **Output**: Activity event to JSONL file
- **Hooks Using This**: PostToolUse, UserPromptSubmit, Stop

### 2. Terminal Provider System

**Location**: `scripts/hooks/providers/`

#### Architecture
```
┌─────────────────────────────────────────┐
│           Core Hook Script              │
│   (session-start.sh / session-end.sh)   │
└──────────────────┬──────────────────────┘
                   │
                   │ Detect $TERM_PROGRAM
                   ▼
       ┌───────────────────────┐
       │   Provider Selection   │
       │                        │
       │  iTerm.app → iterm2.sh │
       │  Others    → generic.sh│
       └───────────┬────────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │   Terminal Provider    │
       │  (Bash Script)         │
       │                        │
       │  1. Detect terminal    │
       │  2. Extract metadata   │
       │  3. Output JSON        │
       └───────────┬────────────┘
                   │
                   ▼
              JSON Output
```

#### Provider Contract

**Input**: Environment variables
- `$TERM_PROGRAM`
- `$TERM`
- `$SHELL`
- Terminal-specific vars

**Output**: JSON with required fields
```json
{
  "session_id": "string",
  "profile": "string",
  "tab_name": "string",
  "window_name": "string"
}
```

**Exit Codes**:
- `0`: Success, JSON will be used
- `non-zero`: Failure, fallback to generic provider

#### Creating New Providers

See `scripts/hooks/providers/README.md` for detailed instructions. Template:

```bash
#!/bin/bash
set -euo pipefail

# 1. Detect if we're in the target terminal
if [[ "${TERM_PROGRAM:-}" != "MyTerminal" ]]; then
  exit 1
fi

# 2. Extract metadata
SESSION_ID="${MY_TERM_SESSION:-unknown}"
PROFILE="${MY_TERM_PROFILE:-unknown}"

# 3. Output JSON
jq -nc \
  --arg session_id "$SESSION_ID" \
  --arg profile "$PROFILE" \
  --arg tab_name "unknown" \
  --arg window_name "unknown" \
  '{
    session_id: $session_id,
    profile: $profile,
    tab_name: $tab_name,
    window_name: $window_name
  }'
```

### 3. Event Stream

**Location**: `~/.agent-tracker/sessions.jsonl`

#### Format
- JSONL (JSON Lines): One JSON object per line
- Compact single-line format (no pretty printing)
- Append-only for concurrent write safety

#### Event Types
1. **session_start** - Session begins
2. **session_end** - Session terminates
3. **activity** - Activity events (tool use, prompts, etc.)

### 4. Event Watcher

**Location**: `src/services/EventWatcher.ts`

#### Responsibilities
- Watch JSONL file for changes using `fs.watch()`
- Incrementally read new events (tracks last position)
- Parse JSON and validate schema
- Dispatch events to handler callbacks
- Handle errors gracefully

#### Implementation Details

```typescript
class EventWatcher {
  private lastPosition = 0;  // Track file position
  private isReading = false; // Prevent concurrent reads

  readNewEvents() {
    // 1. Check if file was truncated
    if (fileSize < lastPosition) lastPosition = 0;

    // 2. Read only new bytes
    const newData = readFromPosition(lastPosition);
    lastPosition = fileSize;

    // 3. Parse JSONL
    for (const line of lines) {
      const event = JSON.parse(line);
      handleEvent(event);
    }
  }
}
```

### 5. Activity Store (State Management)

**Location**: `src/services/ActivityStore.ts`

#### Redux Pattern Implementation

```typescript
// State shape
interface ActivityState {
  sessions: Map<string, Session>;
  recentActivity: ActivityEvent[];
  stats: {
    totalEvents: number;
    eventsByType: Record<string, number>;
  };
}

// Pure reducer
function activityReducer(
  state: ActivityState,
  action: Action
): ActivityState {
  switch (action.type) {
    case 'SESSION_START':
      return { ...state, sessions: addSession(...) };
    case 'ACTIVITY_TOOL_USE':
      return { ...state, sessions: updateActivity(...) };
    // ...
  }
}

// Store with observer pattern
class ActivityStore {
  dispatch(action: Action) {
    const newState = activityReducer(this.state, action);
    if (newState !== this.state) {
      this.state = newState;
      notifyListeners();
    }
  }
}
```

#### Benefits
- **Predictable**: Pure functions, no side effects
- **Testable**: Easy to unit test reducers
- **Time-travel**: Could add undo/redo
- **Debuggable**: Log all actions for inspection

### 6. TUI Layer

**Location**: `src/App.tsx`, `src/components/`

#### Component Structure

```
App
├── SessionList
│   └── SessionListItem (per session)
│       ├── Status indicator (●/○/✕)
│       ├── Display name (iTerm tab or directory)
│       └── Metadata (terminal, profile, time)
└── SessionDetail
    ├── Status badge
    ├── Session info (ID, cwd)
    ├── Terminal info (with iTerm details)
    └── Timestamps (start, last activity, end)
```

#### State Integration

```typescript
function App() {
  const [store] = useState(() => new ActivityStore());
  const [sessions, setSessions] = useState([]);

  // Subscribe to state changes
  useEffect(() => {
    return store.subscribe(() => {
      setSessions(store.getSessions());
    });
  }, [store]);

  // Connect EventWatcher to store
  const [watcher] = useState(() => new EventWatcher({
    onSessionStart: (e) => store.dispatch(actions.sessionStart(e)),
    onActivity: (e) => store.dispatch(actions.activityToolUse(e)),
  }));
}
```

## Data Flow

### Session Lifecycle

```
1. User starts Claude session
   ↓
2. SessionStart hook fires
   ↓
3. session-start.sh executes
   ↓
4. Terminal provider extracts metadata
   ↓
5. Event written to sessions.jsonl
   ↓
6. EventWatcher detects file change
   ↓
7. Event parsed and validated
   ↓
8. ActivityStore.dispatch(SESSION_START)
   ↓
9. Reducer creates new state
   ↓
10. Listeners notified
   ↓
11. React re-renders TUI
```

### Activity Tracking

```
User submits prompt → UserPromptSubmit hook
Tool executes      → PostToolUse hook
Claude responds    → Stop hook
   ↓
activity.sh creates activity event
   ↓
Event → JSONL → EventWatcher → ActivityStore
   ↓
Session lastActivityTime updated
   ↓
Session marked as "active"
   ↓
TUI shows green status indicator
```

## State Management

### State Shape

```typescript
{
  sessions: Map<sessionId, {
    id: string;
    cwd: string;
    terminal: {
      term_program: string;
      iterm: {
        tab_name: string;
        window_name: string;
        profile: string;
        session_id: string;
      };
      // ... other fields
    };
    status: 'active' | 'inactive' | 'ended';
    startTime: Date;
    lastActivityTime: Date;
    endTime?: Date;
  }>;
  recentActivity: ActivityEvent[];  // Last 100 events
  stats: {
    totalEvents: number;
    eventsByType: {
      SESSION_START: 42,
      ACTIVITY_TOOL_USE: 156,
      // ...
    };
  };
}
```

### Action Types

```typescript
type Action =
  | { type: 'SESSION_START', payload: SessionStartEvent }
  | { type: 'SESSION_END', payload: SessionEndEvent }
  | { type: 'ACTIVITY_TOOL_USE', payload: ActivityEvent }
  | { type: 'ACTIVITY_PROMPT_SUBMIT', payload: ActivityEvent }
  | { type: 'ACTIVITY_STOP', payload: ActivityEvent }
  | { type: 'UPDATE_SESSION_STATUSES', payload: { ... } };
```

### Session State Transitions

```
   new session
       ↓
   [active] ←──── activity event (tool, prompt, etc.)
       ↓
   5 min no activity
       ↓
  [inactive] ──── activity event ──→ [active]
       ↓
  session_end event
       ↓
    [ended] ──── 1 min ──→ removed from state
```

## Event Schema

### Session Start Event

```typescript
{
  event_type: "session_start",
  session_id: "uuid",
  cwd: "/path/to/directory",
  transcript_path: "/path/to/transcript.jsonl",
  terminal: {
    tty: "/dev/ttys001",
    term: "xterm-256color",
    shell: "/bin/zsh",
    ppid: "12345",
    term_program: "iTerm.app",
    term_session_id: "w0t4p1:abc123",
    lc_terminal: "iTerm2",
    lc_terminal_version: "3.5.14",
    iterm: {
      session_id: "w0t4p1:abc123",
      profile: "Default",
      tab_name: "My Tab Title",
      window_name: "MacBook-Pro"
    }
  },
  docker: {
    is_container: false,
    container_id: "unknown",
    container_name: "unknown"
  },
  timestamp: "2025-10-16T08:31:52Z"
}
```

### Activity Event

```typescript
{
  event_type: "activity",
  activity_type: "tool_use" | "prompt_submit" | "stop" | "subagent_stop" | "notification",
  session_id: "uuid",
  timestamp: "2025-10-16T08:32:15Z",
  tool_name: "Read",  // only for tool_use
  hook_event_name: "PostToolUse"
}
```

## Design Patterns

### 1. Redux Pattern (State Management)
- **Pure reducers**: `(state, action) => newState`
- **Immutable updates**: Never mutate state directly
- **Single source of truth**: ActivityStore owns all state
- **Observable**: Listeners notified on state changes

### 2. Provider Pattern (Terminal Detection)
- **Interface**: Common contract for all providers
- **Pluggable**: Easy to add new terminal support
- **Fallback**: Graceful degradation to generic provider
- **Isolated**: Each provider is self-contained

### 3. Observer Pattern (State Updates)
- **Subscribe**: Components register listeners
- **Notify**: Store calls all listeners on change
- **Unsubscribe**: Cleanup on component unmount
- **React integration**: `useEffect` hooks

### 4. Event Sourcing (Partial)
- **Append-only log**: JSONL file is immutable
- **Replay**: Could rebuild state from events
- **Audit trail**: Full history of all events
- **Not full event sourcing**: State not purely derived

## Testing Strategy

### Unit Tests

**Reducer Tests** (`ActivityStore.test.ts`)
```typescript
test('SESSION_START adds new session', () => {
  const state = initialState;
  const action = actions.sessionStart(event);
  const newState = activityReducer(state, action);

  expect(newState.sessions.has(sessionId)).toBe(true);
});
```

**EventWatcher Tests** (`EventWatcher.test.ts`)
- Mock file system
- Test incremental reads
- Test event parsing
- Test error handling

### Integration Tests

**EventWatcher Integration** (`EventWatcher.integration.test.ts`)
- Real file writes
- Watch and parse events
- Verify callbacks fired

### TDD Loop

```
1. Write failing test
2. Implement feature
3. Run tests
4. Refactor
5. Repeat
```

## Performance Considerations

### File Watching
- **Incremental reads**: Only read new bytes, not entire file
- **Position tracking**: Avoid re-parsing old events
- **Debouncing**: Multiple writes trigger single read

### State Updates
- **Immutable**: Use structural sharing (spread operators)
- **Map data structure**: O(1) lookups by session ID
- **Sorted on read**: Sort sessions when accessed, not on every update

### Memory Management
- **Recent activity cap**: Keep only last 100 events
- **Auto-cleanup**: Remove ended sessions after 1 minute
- **No persistence**: State cleared on TUI restart (future enhancement)

## Extension Points

### Adding New Hooks

1. Update `.claude-plugin/hooks/hooks.json`
2. Create or reuse hook script
3. Define event schema in `src/types/events.ts`
4. Add action type in `src/types/actions.ts`
5. Handle in reducer (`src/services/ActivityStore.ts`)
6. Update EventWatcher handler

### Adding New Terminal Providers

1. Copy `scripts/hooks/providers/template.sh`
2. Implement detection and metadata extraction
3. Update session-start.sh and session-end.sh
4. Test with target terminal
5. Document in `scripts/hooks/providers/README.md`

### Adding New UI Components

1. Create component in `src/components/`
2. Connect to ActivityStore via props
3. Use Ink Box/Text for layout
4. Test with demo sessions

## Future Architecture Improvements

- [ ] **Middleware system**: Add logging, analytics, persistence middleware to ActivityStore
- [ ] **Plugin architecture**: Make terminal providers discoverable/auto-loadable
- [ ] **Event persistence**: SQLite or IndexedDB for session history
- [ ] **Time-travel debugging**: Record and replay action sequences
- [ ] **Remote monitoring**: WebSocket server for remote TUI access
- [ ] **Multi-user support**: Separate state per user in multi-user systems
