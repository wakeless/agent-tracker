# TUI Development Guide

This directory contains the Ink/React TUI application for Agent Tracker.

## React/Ink Guidelines

### Design Philosophy

- **ALWAYS** use single directional flow of data
- Rarely use `useEffect` - this is prone to errors and if we are writing declaratively is unnecessary
- Do not over-optimize. If we need to optimize with stable functions or state, comment as to why

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

## Architecture

The TUI follows a Redux-style state management pattern:

- **ActivityStore** (`services/ActivityStore.ts`) - Central state with reducer pattern
- **SessionTrackerService** (`services/SessionTrackerService.ts`) - Orchestrates watchers and store
- **EventWatcher** (`services/EventWatcher.ts`) - Watches JSONL for new events
- **TranscriptWatcher** (`services/TranscriptWatcher.ts`) - Watches transcript files for updates

### Data Flow

```
JSONL Events → EventWatcher → dispatch(action) → ActivityStore → React Components
```

Components subscribe to store changes and re-render when state updates.

## Cross-Component Data Usage

When adding or modifying data in types/state:

1. **Search for all usages** of related types across the codebase
2. **Check all UI components** that display session/activity data
3. **Update consistently** across SessionList, SessionDetail, and any other views

**Example**: If adding `session.awaitingInput`, check:
- `src/components/SessionList.tsx` - List view display
- `src/components/SessionDetail.tsx` - Detail view display
- `src/services/ActivityStore.ts` - State management
- `src/types/session.ts` - Type definitions

## Debugging

### Monitor Session Events

```bash
tail -f ~/.agent-tracker/sessions.jsonl
```

### Debug Commands

```bash
# View current session state (what the TUI sees)
npm run debug:sessions -- --session-id <session-id>

# View event timeline for a session
npm run debug:timeline -- --session-id <session-id> --limit 30
```

### Common Quick Checks

**Session not showing or incorrect state?**
1. Run: `npm run debug:timeline -- --session-id <id>`
2. Look for: `session_end` followed by activity (session was re-opened)
3. Check state: `npm run debug:sessions -- --session-id <id>`

**Key fields to verify:**
- `status`: Should be "active" for running sessions
- `isPhantom`: Should be false for real sessions
- `lastActivityTime`: Should match recent activity
- `endTime`: Should be undefined for active sessions
