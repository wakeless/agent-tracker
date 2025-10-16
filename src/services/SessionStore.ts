import { Session, SessionStatus } from '../types/session.js';
import { SessionStartEvent, SessionEndEvent } from '../types/events.js';

export interface SessionStoreConfig {
  inactiveThresholdMs?: number; // Time before a session is considered inactive
  removeEndedSessionsMs?: number; // Time before ended sessions are removed
}

export class SessionStore {
  private sessions = new Map<string, Session>();
  private config: Required<SessionStoreConfig>;
  private listeners = new Set<() => void>();

  constructor(config: SessionStoreConfig = {}) {
    this.config = {
      inactiveThresholdMs: config.inactiveThresholdMs ?? 5 * 60 * 1000, // 5 minutes
      removeEndedSessionsMs: config.removeEndedSessionsMs ?? 60 * 1000, // 1 minute
    };
  }

  /**
   * Add or update a session from a session start event
   */
  handleSessionStart(event: SessionStartEvent): void {
    const session: Session = {
      id: event.session_id,
      cwd: event.cwd,
      transcriptPath: event.transcript_path,
      terminal: event.terminal,
      status: 'active',
      startTime: new Date(event.timestamp),
      lastActivityTime: new Date(event.timestamp),
    };

    this.sessions.set(event.session_id, session);
    this.notifyListeners();
  }

  /**
   * Mark a session as ended from a session end event
   */
  handleSessionEnd(event: SessionEndEvent): void {
    const session = this.sessions.get(event.session_id);
    if (session) {
      session.status = 'ended';
      session.endTime = new Date(event.timestamp);
      this.notifyListeners();
    }
  }

  /**
   * Update session activity (called when we detect activity)
   */
  updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status !== 'ended') {
      session.lastActivityTime = new Date();
      session.status = 'active';
      this.notifyListeners();
    }
  }

  /**
   * Update session statuses based on activity thresholds
   * Should be called periodically
   */
  updateSessionStatuses(): void {
    const now = Date.now();
    let changed = false;

    for (const session of this.sessions.values()) {
      if (session.status === 'ended') {
        // Remove ended sessions after threshold
        if (session.endTime &&
            now - session.endTime.getTime() > this.config.removeEndedSessionsMs) {
          this.sessions.delete(session.id);
          changed = true;
        }
      } else {
        // Mark sessions as inactive if no recent activity
        const timeSinceActivity = now - session.lastActivityTime.getTime();
        const shouldBeInactive = timeSinceActivity > this.config.inactiveThresholdMs;

        if (shouldBeInactive && session.status === 'active') {
          session.status = 'inactive';
          changed = true;
        } else if (!shouldBeInactive && session.status === 'inactive') {
          session.status = 'active';
          changed = true;
        }
      }
    }

    if (changed) {
      this.notifyListeners();
    }
  }

  /**
   * Get all sessions, sorted by activity (most recent first)
   */
  getSessions(): Session[] {
    const sessions = Array.from(this.sessions.values());

    return sessions.sort((a, b) => {
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
    return this.sessions.get(sessionId);
  }

  /**
   * Get count of sessions by status
   */
  getSessionCounts(): { active: number; inactive: number; ended: number; total: number } {
    let active = 0;
    let inactive = 0;
    let ended = 0;

    for (const session of this.sessions.values()) {
      if (session.status === 'active') active++;
      else if (session.status === 'inactive') inactive++;
      else if (session.status === 'ended') ended++;
    }

    return { active, inactive, ended, total: this.sessions.size };
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear();
    this.notifyListeners();
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
