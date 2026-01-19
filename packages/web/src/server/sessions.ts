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

export interface SessionsResponse {
  sessions: Session[];
  counts: SessionCounts;
}

export const getSessions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionsResponse> => {
    const svc = getService();
    svc.updateSessionStatuses();

    const sessions = svc.getSessions();
    const counts = svc.getSessionCounts();

    return {
      sessions,
      counts,
    };
  }
);

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (id: string): Promise<{ session: Session | null }> => {
    const svc = getService();
    const sessions = svc.getSessions();
    const session = sessions.find((s) => s.id === id) || null;

    return { session };
  }
);

export interface TranscriptResponse {
  entries: ParsedTranscriptEntry[];
  total: number;
}

export const getTranscript = createServerFn({ method: 'GET' }).handler(
  async (transcriptPath: string): Promise<TranscriptResponse> => {
    try {
      const reader = new TranscriptReader();
      const entries = await reader.readTranscript(transcriptPath);

      return {
        entries,
        total: entries.length,
      };
    } catch {
      // Return empty for missing transcripts (new sessions)
      return {
        entries: [],
        total: 0,
      };
    }
  }
);
