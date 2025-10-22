// Redux-style ActivityStore with reducer pattern
// Manages session state and activity tracking

import { Session, SessionStatus } from '../types/session.js';
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
 * Initial State
 */
const initialState: ActivityState = {
  sessions: new Map(),
  recentActivity: [],
  stats: {
    totalEvents: 0,
    eventsByType: {},
  },
};

// ============================================================================
// Phantom Session Detection
// ============================================================================

/**
 * Detect if a session is a phantom based on transcript file times
 * A session is phantom if file mtime - birthtime < 60 seconds
 */
function detectPhantomSession(
  transcriptFile: { birthtime: string; mtime: string; size: number } | undefined
): boolean {
  if (!transcriptFile) return false;

  const birthtime = new Date(transcriptFile.birthtime);
  const mtime = new Date(transcriptFile.mtime);
  const diffSeconds = (mtime.getTime() - birthtime.getTime()) / 1000;

  // If file hasn't been written to after creation, it's likely a phantom
  // Increased threshold to 50KB to catch phantom sessions with file-history-snapshot entries
  return diffSeconds < 60 && transcriptFile.size < 50000;
}

/**
 * Find the real session that this phantom belongs to
 * Look for sessions in the same CWD with activity overlapping the phantom's start time
 */
function findRealSession(
  phantomSessionId: string,
  phantomStartTime: Date,
  phantomCwd: string,
  existingSessions: Map<string, Session>
): string | undefined {
  for (const [sessionId, session] of existingSessions) {
    // Skip self
    if (sessionId === phantomSessionId) continue;

    // Must be in same CWD
    if (session.cwd !== phantomCwd) continue;

    // Must have started before phantom
    if (session.startTime >= phantomStartTime) continue;

    // Must still be active at phantom's start time (no end time OR end time > phantom start)
    if (session.endTime && session.endTime < phantomStartTime) continue;

    // Must have recent activity (within 30 minutes of phantom start)
    const timeDiff = Math.abs(session.lastActivityTime.getTime() - phantomStartTime.getTime());
    if (timeDiff < 30 * 60 * 1000) {
      return sessionId;
    }
  }

  return undefined;
}

/**
 * Pure Reducer Function
 * Takes current state and action, returns new state
 */
export function activityReducer(state: ActivityState, action: Action): ActivityState {
  switch (action.type) {
    case 'SESSION_START': {
      const { payload } = action;

      // Parse transcript file info
      const transcriptFile = payload.transcript_file as
        | { birthtime: string; mtime: string; size: number }
        | undefined;

      // Detect if this is a phantom session
      const isPhantom = detectPhantomSession(transcriptFile);
      const startTime = new Date(payload.timestamp);

      // Find the real session if this is a phantom
      let phantomOf: string | undefined;
      if (isPhantom) {
        phantomOf = findRealSession(
          payload.session_id,
          startTime,
          payload.cwd,
          state.sessions
        );
      }

      const newSession: Session = {
        id: payload.session_id,
        cwd: payload.cwd,
        transcriptPath: payload.transcript_path,
        terminal: payload.terminal,
        git: payload.git,
        status: 'active',
        startTime,
        lastActivityTime: startTime,
        awaitingInput: false,
        // Phantom detection fields
        isPhantom,
        phantomOf,
        transcriptBirthtime: transcriptFile ? new Date(transcriptFile.birthtime) : undefined,
        transcriptModifiedTime: transcriptFile ? new Date(transcriptFile.mtime) : undefined,
      };

      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, newSession);

      return {
        ...state,
        sessions: newSessions,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            SESSION_START: (state.stats.eventsByType.SESSION_START || 0) + 1,
          },
        },
      };
    }

    case 'SESSION_END': {
      const { payload } = action;
      const session = state.sessions.get(payload.session_id);

      if (!session) return state;

      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        status: 'ended',
        endTime: new Date(payload.timestamp),
      });

      return {
        ...state,
        sessions: newSessions,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            SESSION_END: (state.stats.eventsByType.SESSION_END || 0) + 1,
          },
        },
      };
    }

    case 'ACTIVITY_NOTIFICATION': {
      const { payload } = action;
      const session = state.sessions.get(payload.session_id);

      if (!session || session.status === 'ended') return state;

      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: new Date(payload.timestamp),
        status: 'active',
        awaitingInput: true, // Set awaiting input on notification
        notificationMessage: payload.notification_message,
      });

      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);

      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1,
          },
        },
      };
    }

    case 'ACTIVITY_PROMPT_SUBMIT':
    case 'ACTIVITY_TOOL_USE': {
      const { payload } = action;
      const session = state.sessions.get(payload.session_id);

      if (!session || session.status === 'ended') return state;

      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: new Date(payload.timestamp),
        status: 'active',
        awaitingInput: false, // Clear awaiting input on user response or tool use
        notificationMessage: undefined,
      });

      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);

      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1,
          },
        },
      };
    }

    case 'ACTIVITY_STOP': {
      const { payload } = action;
      const session = state.sessions.get(payload.session_id);

      if (!session || session.status === 'ended') return state;

      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: new Date(payload.timestamp),
        status: 'active',
        awaitingInput: true, // Agent finished responding, now awaiting user input
        notificationMessage: 'Awaiting user input',
      });

      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);

      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1,
          },
        },
      };
    }

    case 'ACTIVITY_SUBAGENT_STOP': {
      const { payload } = action;
      const session = state.sessions.get(payload.session_id);

      if (!session || session.status === 'ended') return state;

      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: new Date(payload.timestamp),
        status: 'active',
      });

      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);

      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1,
          },
        },
      };
    }

    case 'UPDATE_SESSION_STATUSES': {
      const { currentTime, inactiveThresholdMs, removeEndedSessionsMs } = action.payload;
      const newSessions = new Map<string, Session>();
      let changed = false;

      for (const [id, session] of state.sessions) {
        if (session.status === 'ended') {
          // Remove ended sessions after threshold
          if (session.endTime &&
              currentTime - session.endTime.getTime() > removeEndedSessionsMs) {
            changed = true;
            continue; // Don't add to newSessions (effectively removing it)
          }
          newSessions.set(id, session);
        } else {
          // Mark sessions as inactive if no recent activity
          const timeSinceActivity = currentTime - session.lastActivityTime.getTime();
          const shouldBeInactive = timeSinceActivity > inactiveThresholdMs;

          if (shouldBeInactive && session.status === 'active') {
            newSessions.set(id, { ...session, status: 'inactive' });
            changed = true;
          } else if (!shouldBeInactive && session.status === 'inactive') {
            newSessions.set(id, { ...session, status: 'active' });
            changed = true;
          } else {
            newSessions.set(id, session);
          }
        }
      }

      return changed ? { ...state, sessions: newSessions } : state;
    }

    case 'UPDATE_WORK_SUMMARY': {
      const { sessionId, summary } = action.payload;
      const session = state.sessions.get(sessionId);

      if (!session) return state;

      const newSessions = new Map(state.sessions);
      newSessions.set(sessionId, {
        ...session,
        workSummary: summary,
        lastActivityTime: new Date(), // Update activity time when work summary changes
      });

      return {
        ...state,
        sessions: newSessions,
      };
    }

    default:
      return state;
  }
}

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
export class ActivityStore {
  private state: ActivityState;
  private listeners = new Set<() => void>();
  private config: Required<ActivityStoreConfig>;

  constructor(config: ActivityStoreConfig = {}) {
    this.state = initialState;
    this.config = {
      inactiveThresholdMs: config.inactiveThresholdMs ?? 5 * 60 * 1000, // 5 minutes
      removeEndedSessionsMs: config.removeEndedSessionsMs ?? 60 * 1000, // 1 minute
      enableLogging: config.enableLogging ?? false,
    };
  }

  /**
   * Dispatch an action to the reducer
   */
  dispatch(action: Action): void {
    if (this.config.enableLogging) {
      console.log('[ActivityStore] Action:', action.type, action.payload);
    }

    const previousState = this.state;
    this.state = activityReducer(this.state, action);

    if (this.state !== previousState) {
      if (this.config.enableLogging) {
        console.log('[ActivityStore] State changed');
      }
      this.notifyListeners();
    }
  }

  /**
   * Get current state
   */
  getState(): ActivityState {
    return this.state;
  }

  /**
   * Get all sessions, sorted by priority
   * Priority order: awaiting input > active > inactive > ended
   * Phantom sessions are filtered out by default
   */
  getSessions(): Session[] {
    const sessions = Array.from(this.state.sessions.values())
      // Filter out phantom sessions
      .filter(session => !session.isPhantom);

    return sessions.sort((a, b) => {
      // Awaiting input sessions always at top (highest priority)
      if (a.awaitingInput && !b.awaitingInput) return -1;
      if (b.awaitingInput && !a.awaitingInput) return 1;

      // Ended sessions always go to bottom
      if (a.status === 'ended' && b.status !== 'ended') return 1;
      if (b.status === 'ended' && a.status !== 'ended') return -1;

      // Active sessions above inactive
      if (a.status === 'active' && b.status === 'inactive') return -1;
      if (b.status === 'active' && a.status === 'inactive') return 1;

      // Within same status, sort by last activity
      return b.lastActivityTime.getTime() - a.lastActivityTime.getTime();
    });
  }

  /**
   * Get a specific session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.state.sessions.get(sessionId);
  }

  /**
   * Get count of sessions by status
   */
  getSessionCounts(): { active: number; inactive: number; ended: number; awaitingInput: number; total: number } {
    let active = 0;
    let inactive = 0;
    let ended = 0;
    let awaitingInput = 0;

    for (const session of this.state.sessions.values()) {
      if (session.awaitingInput) awaitingInput++;
      if (session.status === 'active') active++;
      else if (session.status === 'inactive') inactive++;
      else if (session.status === 'ended') ended++;
    }

    return { active, inactive, ended, awaitingInput, total: this.state.sessions.size };
  }

  /**
   * Get recent activity events
   */
  getRecentActivity(limit?: number): ActivityEvent[] {
    return limit ? this.state.recentActivity.slice(0, limit) : this.state.recentActivity;
  }

  /**
   * Get activity events for a specific session
   */
  getSessionActivity(sessionId: string, limit?: number): ActivityEvent[] {
    const sessionEvents = this.state.recentActivity.filter(
      event => event.session_id === sessionId
    );
    return limit ? sessionEvents.slice(0, limit) : sessionEvents;
  }

  /**
   * Get activity statistics
   */
  getStats() {
    return this.state.stats;
  }

  /**
   * Update a session's last activity time from transcript
   * Used to track activity even when events aren't firing
   */
  updateSessionActivityFromTranscript(sessionId: string, timestamp: Date): void {
    const session = this.state.sessions.get(sessionId);

    if (!session || session.status === 'ended') return;

    // Only update if this timestamp is more recent
    if (timestamp > session.lastActivityTime) {
      const newSessions = new Map(this.state.sessions);
      newSessions.set(sessionId, {
        ...session,
        lastActivityTime: timestamp,
        status: 'active', // Mark as active
      });

      this.state = {
        ...this.state,
        sessions: newSessions,
      };

      this.notifyListeners();
    }
  }

  /**
   * Periodic update to refresh session statuses
   */
  updateSessionStatuses(): void {
    this.dispatch({
      type: 'UPDATE_SESSION_STATUSES',
      payload: {
        currentTime: Date.now(),
        inactiveThresholdMs: this.config.inactiveThresholdMs,
        removeEndedSessionsMs: this.config.removeEndedSessionsMs,
      },
    });
  }

  /**
   * Clear all state (useful for testing)
   */
  clear(): void {
    this.state = initialState;
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
