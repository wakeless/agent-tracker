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

export interface TranscriptResponse {
  entries: ParsedTranscriptEntry[];
  total: number;
}

export const getTranscript = createServerFn({ method: 'GET' })
  .handler(async (ctx: { data: string }): Promise<TranscriptResponse> => {
    const transcriptPath = ctx.data;
    try {
      const reader = new TranscriptReader();
      const entries = await reader.readTranscript(transcriptPath);

      // Serialize entries to convert Date objects to ISO strings
      return {
        entries: JSON.parse(JSON.stringify(entries)),
        total: entries.length,
      };
    } catch {
      // Return empty for missing transcripts (new sessions)
      return {
        entries: [],
        total: 0,
      };
    }
  });
