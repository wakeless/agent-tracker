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

import { ActivityStore } from './ActivityStore.js';
import { EventWatcher } from './EventWatcher.js';
import { actions } from '../types/actions.js';
import { Session } from '../types/session.js';

export interface SessionTrackerOptions {
  eventsFilePath: string; // Required to prevent accidentally using default path in tests
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
export class SessionTrackerService {
  private store: ActivityStore;
  private watcher: EventWatcher;
  private started = false;

  constructor(options: SessionTrackerOptions) {
    // Initialize the activity store with optional configuration
    this.store = new ActivityStore({
      enableLogging: options.enableLogging ?? false,
      inactiveThresholdMs: options.inactiveThresholdMs,
      removeEndedSessionsMs: options.removeEndedSessionsMs,
    });

    // Initialize the event watcher with event handlers that dispatch to store
    this.watcher = new EventWatcher(
      {
        onSessionStart: (event) => {
          this.store.dispatch(actions.sessionStart(event));
        },
        onSessionEnd: (event) => {
          this.store.dispatch(actions.sessionEnd(event));
        },
        onActivity: (event) => {
          // Check if this is an MCP work summary tool call
          if (event.activity_type === 'tool_use' &&
              event.tool_name === 'mcp__plugin_agent-tracker_agent-tracker__set_work_summary' &&
              event.tool_input) {
            // Extract summary from tool parameters
            const summary = event.tool_input.summary as string;
            if (summary && typeof summary === 'string') {
              this.store.dispatch(actions.updateWorkSummary(event.session_id, summary));
            }
          }

          // Dispatch specific activity action based on activity_type
          switch (event.activity_type) {
            case 'tool_use':
              this.store.dispatch(actions.activityToolUse(event));
              break;
            case 'prompt_submit':
              this.store.dispatch(actions.activityPromptSubmit(event));
              break;
            case 'stop':
              this.store.dispatch(actions.activityStop(event));
              break;
            case 'subagent_stop':
              this.store.dispatch(actions.activitySubagentStop(event));
              break;
            case 'notification':
              this.store.dispatch(actions.activityNotification(event));
              break;
          }
        },
        onError: (error) => {
          console.error('SessionTrackerService: EventWatcher error:', error);
        },
      },
      { logPath: options.eventsFilePath }
    );
  }

  /**
   * Start watching for events
   * Idempotent - safe to call multiple times
   */
  start(): void {
    if (this.started) {
      return;
    }
    this.watcher.start();
    this.started = true;
  }

  /**
   * Stop watching for events
   * Idempotent - safe to call multiple times
   */
  stop(): void {
    if (!this.started) {
      return;
    }
    this.watcher.stop();
    this.started = false;
  }

  /**
   * Check if the events file exists
   */
  fileExists(): boolean {
    return this.watcher.fileExists();
  }

  /**
   * Get all sessions, sorted by activity (most recent first)
   */
  getSessions(): Session[] {
    return this.store.getSessions();
  }

  /**
   * Get session counts by status
   */
  getSessionCounts(): SessionCounts {
    return this.store.getSessionCounts();
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Manually trigger session status updates
   * Useful for periodic checks of session activity
   */
  updateSessionStatuses(): void {
    this.store.updateSessionStatuses();
  }

  /**
   * Update a session's activity time from its transcript
   * Used to keep session activity current based on transcript file timestamps
   */
  updateSessionActivityFromTranscript(sessionId: string, timestamp: Date): void {
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
  getRecentActivity(limit?: number) {
    return this.store.getRecentActivity(limit);
  }

  /**
   * Get activity events for a specific session
   */
  getSessionActivity(sessionId: string, limit?: number) {
    return this.store.getSessionActivity(sessionId, limit);
  }

  /**
   * Check if the service is currently watching for events
   */
  isStarted(): boolean {
    return this.started;
  }
}
