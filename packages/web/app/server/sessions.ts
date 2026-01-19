import { createServerFn } from '@tanstack/start';
import { ExploreTrackerService, Session, SessionCounts } from '@agent-tracker/core';

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

export const getSession = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<{ session: Session | null }> => {
    const svc = getService();
    const sessions = svc.getSessions();
    const session = sessions.find((s) => s.id === id) || null;

    return { session };
  });
