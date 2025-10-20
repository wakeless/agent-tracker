import { Session } from '../types/session.js';
import { Action, ActivityEvent } from '../types/actions.js';
/**
 * Activity State Shape
 */
export interface ActivityState {
    sessions: Map<string, Session>;
    recentActivity: ActivityEvent[];
    stats: {
        totalEvents: number;
        eventsByType: Record<string, number>;
    };
}
/**
 * Pure Reducer Function
 * Takes current state and action, returns new state
 */
export declare function activityReducer(state: ActivityState, action: Action): ActivityState;
/**
 * ActivityStore Configuration
 */
export interface ActivityStoreConfig {
    inactiveThresholdMs?: number;
    removeEndedSessionsMs?: number;
    enableLogging?: boolean;
}
/**
 * ActivityStore with Redux-style State Management
 */
export declare class ActivityStore {
    private state;
    private listeners;
    private config;
    constructor(config?: ActivityStoreConfig);
    /**
     * Dispatch an action to the reducer
     */
    dispatch(action: Action): void;
    /**
     * Get current state
     */
    getState(): ActivityState;
    /**
     * Get all sessions, sorted by priority
     * Priority order: awaiting input > active > inactive > ended
     */
    getSessions(): Session[];
    /**
     * Get a specific session by ID
     */
    getSession(sessionId: string): Session | undefined;
    /**
     * Get count of sessions by status
     */
    getSessionCounts(): {
        active: number;
        inactive: number;
        ended: number;
        awaitingInput: number;
        total: number;
    };
    /**
     * Get recent activity events
     */
    getRecentActivity(limit?: number): ActivityEvent[];
    /**
     * Get activity events for a specific session
     */
    getSessionActivity(sessionId: string, limit?: number): ActivityEvent[];
    /**
     * Get activity statistics
     */
    getStats(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
    };
    /**
     * Update a session's last activity time from transcript
     * Used to track activity even when events aren't firing
     */
    updateSessionActivityFromTranscript(sessionId: string, timestamp: Date): void;
    /**
     * Periodic update to refresh session statuses
     */
    updateSessionStatuses(): void;
    /**
     * Clear all state (useful for testing)
     */
    clear(): void;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: () => void): () => void;
    /**
     * Notify all listeners of state changes
     */
    private notifyListeners;
}
//# sourceMappingURL=ActivityStore.d.ts.map