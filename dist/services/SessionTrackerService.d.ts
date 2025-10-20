/**
 * SessionTrackerService
 *
 * Standalone service that combines EventWatcher + ActivityStore into a single,
 * React-agnostic library. Can be instantiated independently for testing or use
 * in any context (CLI, web, etc.).
 *
 * This service manages:
 * - Watching for session events from the JSONL file
 * - Processing events and updating session state
 * - Notifying subscribers of state changes
 * - Providing access to session data
 */
import { Session } from '../types/session.js';
export interface SessionTrackerOptions {
    eventsFilePath: string;
    enableLogging?: boolean;
    inactiveThresholdMs?: number;
    removeEndedSessionsMs?: number;
}
export interface SessionCounts {
    total: number;
    active: number;
    inactive: number;
    ended: number;
    awaitingInput: number;
}
/**
 * SessionTrackerService
 *
 * Main service class that encapsulates event watching and state management.
 * Designed to be used as a singleton or instantiated as needed.
 */
export declare class SessionTrackerService {
    private store;
    private watcher;
    private started;
    constructor(options: SessionTrackerOptions);
    /**
     * Start watching for events
     * Idempotent - safe to call multiple times
     */
    start(): void;
    /**
     * Stop watching for events
     * Idempotent - safe to call multiple times
     */
    stop(): void;
    /**
     * Check if the events file exists
     */
    fileExists(): boolean;
    /**
     * Get all sessions, sorted by activity (most recent first)
     */
    getSessions(): Session[];
    /**
     * Get session counts by status
     */
    getSessionCounts(): SessionCounts;
    /**
     * Subscribe to state changes
     * Returns unsubscribe function
     */
    subscribe(listener: () => void): () => void;
    /**
     * Manually trigger session status updates
     * Useful for periodic checks of session activity
     */
    updateSessionStatuses(): void;
    /**
     * Update a session's activity time from its transcript
     * Used to keep session activity current based on transcript file timestamps
     */
    updateSessionActivityFromTranscript(sessionId: string, timestamp: Date): void;
    /**
     * Check if the service is currently watching for events
     */
    isStarted(): boolean;
}
//# sourceMappingURL=SessionTrackerService.d.ts.map