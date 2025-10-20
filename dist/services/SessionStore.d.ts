import { Session } from '../types/session.js';
import { SessionStartEvent, SessionEndEvent } from '../types/events.js';
export interface SessionStoreConfig {
    inactiveThresholdMs?: number;
    removeEndedSessionsMs?: number;
}
export declare class SessionStore {
    private sessions;
    private config;
    private listeners;
    constructor(config?: SessionStoreConfig);
    /**
     * Add or update a session from a session start event
     */
    handleSessionStart(event: SessionStartEvent): void;
    /**
     * Mark a session as ended from a session end event
     */
    handleSessionEnd(event: SessionEndEvent): void;
    /**
     * Update session activity (called when we detect activity)
     */
    updateSessionActivity(sessionId: string): void;
    /**
     * Update session statuses based on activity thresholds
     * Should be called periodically
     */
    updateSessionStatuses(): void;
    /**
     * Get all sessions, sorted by activity (most recent first)
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
        total: number;
    };
    /**
     * Clear all sessions
     */
    clear(): void;
    /**
     * Subscribe to session changes
     */
    subscribe(listener: () => void): () => void;
    /**
     * Notify all listeners of changes
     */
    private notifyListeners;
}
//# sourceMappingURL=SessionStore.d.ts.map