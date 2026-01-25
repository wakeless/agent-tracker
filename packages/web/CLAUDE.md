# Web Client Development Guide

This directory contains the web dashboard for Agent Tracker, built with TanStack Start.

## Architecture

### Server-Side

- **ExploreTrackerService** - Singleton service that watches Claude project directories
- **Server Functions** (`src/server/sessions.ts`) - TanStack server functions for data access

### Client-Side

- **TanStack Query** - Data fetching with polling for updates
- **TanStack Router** - File-based routing

## Data Flow

```
Claude Projects → ExploreTrackerService → Server Functions → TanStack Query → React Components
                                                    ↑
                                              (polls every 5s)
```

Currently uses **polling** for updates. The session list refreshes every 5 seconds via `refetchInterval`.

## Key Files

- `src/server/sessions.ts` - Server functions: `getSessions`, `getSession`, `getTranscript`
- `src/routes/index.tsx` - Session list page
- `src/routes/sessions/$sessionId.tsx` - Session detail page
- `src/routes/sessions/$sessionId_.transcript.tsx` - Transcript view

## Design Considerations

### Polling vs Push

The web client currently polls because:
- Simpler implementation
- Works without WebSocket infrastructure
- Acceptable latency for dashboard use case (5s refresh)

Future: Consider WebSocket or Server-Sent Events for real-time updates if needed.

### Date Serialization

All `Date` objects must be serialized to ISO strings when passing through server functions:

```typescript
return JSON.parse(JSON.stringify(session));
```

### Transcript Pagination

Transcripts use cursor-based pagination with the `before` timestamp parameter for efficient loading of large transcripts.
