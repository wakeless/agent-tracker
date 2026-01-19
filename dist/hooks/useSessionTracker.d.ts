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
import { Session } from '../types/session.js';
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
export declare function useSessionTracker(service: TrackerService): UseSessionTrackerResult;
//# sourceMappingURL=useSessionTracker.d.ts.map