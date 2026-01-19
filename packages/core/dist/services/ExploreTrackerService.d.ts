/**
 * ExploreTrackerService
 *
 * Alternative to SessionTrackerService that discovers sessions by scanning
 * ~/.claude/projects/ instead of relying on hooks. This enables "explore mode"
 * where agent-tracker works out-of-the-box without plugin installation.
 *
 * Provides the same public API as SessionTrackerService for compatibility.
 */
import { Session } from '../types/session.js';
export interface ExploreTrackerOptions {
    claudeProjectsDir?: string;
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
 * ExploreTrackerService
 *
 * Discovers and tracks Claude Code sessions by scanning project directories.
 * Activity is determined by transcript file modification times.
 */
export declare class ExploreTrackerService {
    private scanner;
    private store;
    private started;
    private displayNames;
    constructor(options?: ExploreTrackerOptions);
    /**
     * Start scanning and watching for sessions
     * Idempotent - safe to call multiple times
     */
    start(): void;
    /**
     * Stop scanning and watching
     * Idempotent - safe to call multiple times
     */
    stop(): void;
    /**
     * Check if the projects directory exists
     */
    fileExists(): boolean;
    /**
     * Get all sessions, sorted by activity (most recent first)
     * Enhances sessions with display names from firstPrompt
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
     * Get activity statistics
     */
    getStats(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
    };
    /**
     * Get recent activity events
     */
    getRecentActivity(limit?: number): import("../types/actions.js").ActivityEvent[];
    /**
     * Get activity events for a specific session
     */
    getSessionActivity(sessionId: string, limit?: number): import("../types/actions.js").ActivityEvent[];
    /**
     * Check if the service is currently watching for events
     */
    isStarted(): boolean;
}
//# sourceMappingURL=ExploreTrackerService.d.ts.map