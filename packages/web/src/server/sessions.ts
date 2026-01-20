import { createServerFn } from '@tanstack/react-start';
import { ExploreTrackerService, Session, SessionCounts, TranscriptReader, ParsedTranscriptEntry } from '@agent-tracker/core';

// Singleton service instance for the server
let service: ExploreTrackerService | null = null;

function getService(): ExploreTrackerService {
  if (!service) {
    service = new ExploreTrackerService({
      enableLogging: false,
    });
    service.start();
  }
  return service;
}

// Serialize a session to be JSON-safe (convert Date objects to ISO strings)
function serializeSession(session: Session): Session {
  return JSON.parse(JSON.stringify(session));
}

export interface SessionsResponse {
  sessions: Session[];
  counts: SessionCounts;
}

export const getSessions = createServerFn({ method: 'GET' }).handler(
  async () => {
    const svc = getService();
    svc.updateSessionStatuses();

    const rawSessions = svc.getSessions();
    const sessions = rawSessions.map(serializeSession);
    const counts = svc.getSessionCounts();

    // Return as a plain JSON-stringified object to avoid seroval issues
    const data = {
      sessions,
      counts,
    };

    // Just return the data - types will be inferred
    return data;
  }
);

export const getSession = createServerFn({ method: 'GET' })
  .handler(async (ctx: { data: string }): Promise<{ session: Session | null }> => {
    const id = ctx.data;
    console.log('[getSession] Input ID:', id);

    const svc = getService();
    svc.updateSessionStatuses();  // Refresh session statuses
    const sessions = svc.getSessions();

    console.log('[getSession] Total sessions:', sessions.length);

    const session = sessions.find((s) => s.id === id) || null;
    console.log('[getSession] Found:', !!session);

    return { session: session ? serializeSession(session) : null };
  });

export interface TranscriptRequest {
  path: string;
  limit?: number;        // Number of entries to return (default: 50)
  before?: string;       // Cursor: fetch entries before this ISO timestamp
}

export interface TranscriptResponse {
  entries: ParsedTranscriptEntry[];
  total: number;
  hasMore: boolean;
  oldestTimestamp?: string;  // Cursor for next page
}

export const getTranscript = createServerFn({ method: 'GET' })
  .handler(async (ctx: { data: TranscriptRequest }): Promise<TranscriptResponse> => {
    const { path: transcriptPath, limit = 50, before } = ctx.data;
    try {
      const reader = new TranscriptReader();
      const allEntries = await reader.readTranscript(transcriptPath);

      // Filter out system/meta entries
      const userEntries = allEntries.filter(
        e => e.type !== 'system' && e.type !== 'file-history' && e.type !== 'meta'
      );

      const total = userEntries.length;

      // Sort by timestamp descending (most recent first)
      const sorted = [...userEntries].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // If cursor provided, find entries older than cursor
      let filtered = sorted;
      if (before) {
        const cursorTime = new Date(before).getTime();
        filtered = sorted.filter(e => new Date(e.timestamp).getTime() < cursorTime);
      }

      // Take the first `limit` entries (most recent of the filtered set)
      const entries = filtered.slice(0, limit);
      const hasMore = filtered.length > limit;

      // Get the oldest timestamp in this batch for the next cursor
      const oldestTimestamp = entries.length > 0
        ? new Date(entries[entries.length - 1].timestamp).toISOString()
        : undefined;

      // Serialize entries to convert Date objects to ISO strings
      return {
        entries: JSON.parse(JSON.stringify(entries)),
        total,
        hasMore,
        oldestTimestamp,
      };
    } catch {
      // Return empty for missing transcripts (new sessions)
      return {
        entries: [],
        total: 0,
        hasMore: false,
      };
    }
  });
