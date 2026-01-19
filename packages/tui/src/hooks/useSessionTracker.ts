/**
 * useSessionTracker Hook
 *
 * React hook that subscribes to a tracker service instance and provides
 * sessions data to components.
 *
 * This hook ensures:
 * - Stable service reference across renders (doesn't recreate service)
 * - Proper subscription/unsubscription lifecycle
 * - Re-renders only when session data changes
 */

import { useState, useEffect } from 'react';
import { Session } from '@agent-tracker/core';

/**
 * Common interface for tracker services
 * Both SessionTrackerService and ExploreTrackerService implement this
 */
export interface TrackerService {
  getSessions(): Session[];
  subscribe(listener: () => void): () => void;
}

export interface UseSessionTrackerResult {
  /** All sessions, sorted by priority */
  sessions: Session[];
  /** The tracker service instance */
  service: TrackerService;
}

/**
 * Hook to subscribe to a tracker service and get session data
 *
 * @param service - The tracker service instance to subscribe to
 * @returns An object containing sessions array and the service instance
 *
 * @example
 * ```typescript
 * const sessionTracker = new SessionTrackerService();
 * sessionTracker.start();
 *
 * function MyComponent() {
 *   const { sessions, service } = useSessionTracker(sessionTracker);
 *
 *   return (
 *     <div>
 *       {sessions.map(session => (
 *         <div key={session.id}>{session.cwd}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionTracker(service: TrackerService): UseSessionTrackerResult {
  // Initialize state with current sessions from service
  const [sessions, setSessions] = useState<Session[]>(() => service.getSessions());

  useEffect(() => {
    // Subscribe to service changes
    // Whenever the service notifies of state changes, update our local state
    const unsubscribe = service.subscribe(() => {
      setSessions(service.getSessions());
    });

    // Cleanup: unsubscribe when component unmounts or service changes
    return unsubscribe;
  }, [service]);

  return {
    sessions,
    service,
  };
}
