import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionStore } from './SessionStore.js';
import { SessionStartEvent, SessionEndEvent } from '../types/events.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore({
      inactiveThresholdMs: 1000, // 1 second for testing
      removeEndedSessionsMs: 500, // 0.5 seconds for testing
    });
  });

  const createStartEvent = (sessionId: string, timestamp?: string): SessionStartEvent => ({
    event_type: 'session_start',
    session_id: sessionId,
    cwd: `/test/dir-${sessionId}`,
    transcript_path: `/test/transcript-${sessionId}.json`,
    terminal: {
      tty: '/dev/ttys001',
      term: 'xterm-256color',
      shell: '/bin/zsh',
      ppid: '12345',
      term_program: 'iTerm.app',
      term_session_id: 'test-session',
    },
    timestamp: timestamp || new Date().toISOString(),
  });

  const createEndEvent = (sessionId: string, timestamp?: string): SessionEndEvent => ({
    event_type: 'session_end',
    session_id: sessionId,
    cwd: `/test/dir-${sessionId}`,
    transcript_path: `/test/transcript-${sessionId}.json`,
    terminal: {
      tty: '/dev/ttys001',
      term: 'xterm-256color',
      shell: '/bin/zsh',
      ppid: '12345',
      term_program: 'iTerm.app',
      term_session_id: 'test-session',
    },
    timestamp: timestamp || new Date().toISOString(),
  });

  describe('handleSessionStart', () => {
    it('should add a new session', () => {
      const event = createStartEvent('session-1');
      store.handleSessionStart(event);

      const sessions = store.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[0].status).toBe('active');
    });

    it('should update an existing session', () => {
      const event1 = createStartEvent('session-1', '2025-10-16T00:00:00Z');
      const event2 = createStartEvent('session-1', '2025-10-16T00:01:00Z');

      store.handleSessionStart(event1);
      store.handleSessionStart(event2);

      const sessions = store.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].startTime.toISOString()).toBe('2025-10-16T00:01:00.000Z');
    });
  });

  describe('handleSessionEnd', () => {
    it('should mark a session as ended', () => {
      const startEvent = createStartEvent('session-1');
      const endEvent = createEndEvent('session-1');

      store.handleSessionStart(startEvent);
      store.handleSessionEnd(endEvent);

      const session = store.getSession('session-1');
      expect(session?.status).toBe('ended');
      expect(session?.endTime).toBeDefined();
    });

    it('should handle ending a non-existent session gracefully', () => {
      const endEvent = createEndEvent('non-existent');
      store.handleSessionEnd(endEvent);

      const sessions = store.getSessions();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('updateSessionActivity', () => {
    it('should update last activity time', () => {
      const event = createStartEvent('session-1', '2025-10-16T00:00:00Z');
      store.handleSessionStart(event);

      const originalTime = store.getSession('session-1')!.lastActivityTime;

      // Wait a tiny bit then update activity
      setTimeout(() => {
        store.updateSessionActivity('session-1');
        const newTime = store.getSession('session-1')!.lastActivityTime;
        expect(newTime.getTime()).toBeGreaterThan(originalTime.getTime());
      }, 10);
    });

    it('should not update ended sessions', () => {
      const startEvent = createStartEvent('session-1');
      const endEvent = createEndEvent('session-1');

      store.handleSessionStart(startEvent);
      store.handleSessionEnd(endEvent);

      const endTime = store.getSession('session-1')!.endTime!;
      store.updateSessionActivity('session-1');

      expect(store.getSession('session-1')?.status).toBe('ended');
      expect(store.getSession('session-1')?.endTime).toEqual(endTime);
    });
  });

  describe('updateSessionStatuses', () => {
    it('should mark sessions as inactive after threshold', async () => {
      const event = createStartEvent('session-1', new Date(Date.now() - 2000).toISOString());
      store.handleSessionStart(event);

      expect(store.getSession('session-1')?.status).toBe('active');

      store.updateSessionStatuses();

      expect(store.getSession('session-1')?.status).toBe('inactive');
    });

    it('should mark inactive sessions as active again when activity resumes', async () => {
      const event = createStartEvent('session-1', new Date(Date.now() - 2000).toISOString());
      store.handleSessionStart(event);

      store.updateSessionStatuses();
      expect(store.getSession('session-1')?.status).toBe('inactive');

      store.updateSessionActivity('session-1');
      store.updateSessionStatuses();

      expect(store.getSession('session-1')?.status).toBe('active');
    });

    it('should remove ended sessions after threshold', async () => {
      const startEvent = createStartEvent('session-1');
      const endEvent = createEndEvent('session-1', new Date(Date.now() - 1000).toISOString());

      store.handleSessionStart(startEvent);
      store.handleSessionEnd(endEvent);

      expect(store.getSessions()).toHaveLength(1);

      store.updateSessionStatuses();

      expect(store.getSessions()).toHaveLength(0);
    });
  });

  describe('getSessions', () => {
    it('should sort active sessions before inactive', () => {
      const event1 = createStartEvent('session-1', new Date(Date.now() - 2000).toISOString());
      const event2 = createStartEvent('session-2');

      store.handleSessionStart(event1);
      store.handleSessionStart(event2);
      store.updateSessionStatuses();

      const sessions = store.getSessions();
      expect(sessions[0].id).toBe('session-2'); // active
      expect(sessions[0].status).toBe('active');
      expect(sessions[1].id).toBe('session-1'); // inactive
      expect(sessions[1].status).toBe('inactive');
    });

    it('should sort ended sessions last', () => {
      const event1 = createStartEvent('session-1');
      const event2 = createStartEvent('session-2');
      const endEvent = createEndEvent('session-2');

      store.handleSessionStart(event1);
      store.handleSessionStart(event2);
      store.handleSessionEnd(endEvent);

      const sessions = store.getSessions();
      expect(sessions[0].id).toBe('session-1'); // active
      expect(sessions[1].id).toBe('session-2'); // ended
    });

    it('should sort by most recent activity within same status', () => {
      const event1 = createStartEvent('session-1', '2025-10-16T00:00:00Z');
      const event2 = createStartEvent('session-2', '2025-10-16T00:01:00Z');
      const event3 = createStartEvent('session-3', '2025-10-16T00:02:00Z');

      store.handleSessionStart(event1);
      store.handleSessionStart(event2);
      store.handleSessionStart(event3);

      const sessions = store.getSessions();
      expect(sessions[0].id).toBe('session-3'); // most recent
      expect(sessions[1].id).toBe('session-2');
      expect(sessions[2].id).toBe('session-1'); // least recent
    });
  });

  describe('getSessionCounts', () => {
    it('should count sessions by status', () => {
      const event1 = createStartEvent('session-1');
      const event2 = createStartEvent('session-2', new Date(Date.now() - 2000).toISOString());
      const event3 = createStartEvent('session-3');
      const endEvent = createEndEvent('session-3');

      store.handleSessionStart(event1);
      store.handleSessionStart(event2);
      store.handleSessionStart(event3);
      store.handleSessionEnd(endEvent);
      store.updateSessionStatuses();

      const counts = store.getSessionCounts();
      expect(counts.active).toBe(1);
      expect(counts.inactive).toBe(1);
      expect(counts.ended).toBe(1);
      expect(counts.total).toBe(3);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners when sessions change', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      const event = createStartEvent('session-1');
      store.handleSessionStart(event);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      const event1 = createStartEvent('session-1');
      store.handleSessionStart(event1);

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      const event2 = createStartEvent('session-2');
      store.handleSessionStart(event2);

      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('clear', () => {
    it('should remove all sessions', () => {
      store.handleSessionStart(createStartEvent('session-1'));
      store.handleSessionStart(createStartEvent('session-2'));

      expect(store.getSessions()).toHaveLength(2);

      store.clear();

      expect(store.getSessions()).toHaveLength(0);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.clear();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
