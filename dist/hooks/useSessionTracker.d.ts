/**
 * useSessionTracker Hook
 *
 * React hook that subscribes to a SessionTrackerService instance and provides
 * sessions data to components.
 *
 * This hook ensures:
 * - Stable service reference across renders (doesn't recreate service)
 * - Proper subscription/unsubscription lifecycle
 * - Re-renders only when session data changes
 */
import { SessionTrackerService } from '../services/SessionTrackerService.js';
import { Session } from '../types/session.js';
export interface UseSessionTrackerResult {
    /** All sessions, sorted by priority */
    sessions: Session[];
    /** The SessionTrackerService instance */
    service: SessionTrackerService;
}
/**
 * Hook to subscribe to SessionTrackerService and get session data
 *
 * @param service - The SessionTrackerService instance to subscribe to
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
export declare function useSessionTracker(service: SessionTrackerService): UseSessionTrackerResult;
//# sourceMappingURL=useSessionTracker.d.ts.map