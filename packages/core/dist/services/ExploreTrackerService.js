/**
 * ExploreTrackerService
 *
 * Alternative to SessionTrackerService that discovers sessions by scanning
 * ~/.claude/projects/ instead of relying on hooks. This enables "explore mode"
 * where agent-tracker works out-of-the-box without plugin installation.
 *
 * Provides the same public API as SessionTrackerService for compatibility.
 */
import { ProjectScanner } from './ProjectScanner.js';
import { ActivityStore } from './ActivityStore.js';
import { actions } from '../types/actions.js';
/**
 * ExploreTrackerService
 *
 * Discovers and tracks Claude Code sessions by scanning project directories.
 * Activity is determined by transcript file modification times.
 */
export class ExploreTrackerService {
    scanner;
    store;
    started = false;
    displayNames = new Map();
    constructor(options = {}) {
        // Initialize the project scanner
        this.scanner = new ProjectScanner({
            claudeProjectsDir: options.claudeProjectsDir,
            enableLogging: options.enableLogging ?? false,
        });
        // Initialize the activity store with longer thresholds for explore mode
        // Since we can't detect explicit session ends, use longer timeouts
        this.store = new ActivityStore({
            enableLogging: options.enableLogging ?? false,
            inactiveThresholdMs: options.inactiveThresholdMs ?? 5 * 60 * 1000, // 5 minutes
            removeEndedSessionsMs: options.removeEndedSessionsMs ?? 24 * 60 * 60 * 1000, // 24 hours (don't remove)
        });
    }
    /**
     * Start scanning and watching for sessions
     * Idempotent - safe to call multiple times
     */
    start() {
        if (this.started) {
            return;
        }
        this.scanner.start(
        // onSessionDiscovered
        (event) => {
            // Store display name from firstPrompt before dispatching
            // (the store doesn't know about displayName)
            const entries = this.scanner.getKnownSessions();
            const entry = entries.find(e => e.sessionId === event.session_id);
            if (entry?.firstPrompt) {
                const displayName = entry.firstPrompt.length > 60
                    ? entry.firstPrompt.substring(0, 57) + '...'
                    : entry.firstPrompt;
                this.displayNames.set(event.session_id, displayName);
            }
            this.store.dispatch(actions.sessionStart(event));
            // Also update activity time from the entry's modified time
            if (entry) {
                this.store.updateSessionActivityFromTranscript(event.session_id, new Date(entry.modified));
            }
        }, 
        // onSessionUpdated
        (sessionId, modified) => {
            this.store.updateSessionActivityFromTranscript(sessionId, modified);
        });
        this.started = true;
    }
    /**
     * Stop scanning and watching
     * Idempotent - safe to call multiple times
     */
    stop() {
        if (!this.started) {
            return;
        }
        this.scanner.stop();
        this.started = false;
    }
    /**
     * Check if the projects directory exists
     */
    fileExists() {
        return this.scanner.projectsExist();
    }
    /**
     * Get all sessions, sorted by activity (most recent first)
     * Enhances sessions with display names from firstPrompt
     */
    getSessions() {
        const sessions = this.store.getSessions();
        // Enhance sessions with display names
        return sessions.map(session => {
            const displayName = this.displayNames.get(session.id);
            if (displayName && !session.displayName) {
                return { ...session, displayName };
            }
            return session;
        });
    }
    /**
     * Get session counts by status
     */
    getSessionCounts() {
        return this.store.getSessionCounts();
    }
    /**
     * Subscribe to state changes
     * Returns unsubscribe function
     */
    subscribe(listener) {
        return this.store.subscribe(listener);
    }
    /**
     * Manually trigger session status updates
     * Useful for periodic checks of session activity
     */
    updateSessionStatuses() {
        this.store.updateSessionStatuses();
    }
    /**
     * Update a session's activity time from its transcript
     * Used to keep session activity current based on transcript file timestamps
     */
    updateSessionActivityFromTranscript(sessionId, timestamp) {
        this.store.updateSessionActivityFromTranscript(sessionId, timestamp);
    }
    /**
     * Get activity statistics
     */
    getStats() {
        return this.store.getStats();
    }
    /**
     * Get recent activity events
     */
    getRecentActivity(limit) {
        return this.store.getRecentActivity(limit);
    }
    /**
     * Get activity events for a specific session
     */
    getSessionActivity(sessionId, limit) {
        return this.store.getSessionActivity(sessionId, limit);
    }
    /**
     * Check if the service is currently watching for events
     */
    isStarted() {
        return this.started;
    }
}
//# sourceMappingURL=ExploreTrackerService.js.map