import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityStore } from './ActivityStore.js';
import { actions } from '../types/actions.js';
import { SessionStartEvent, SessionEndEvent, ActivityEvent } from '../types/events.js';

describe('ActivityStore', () => {
  let store: ActivityStore;

  beforeEach(() => {
    store = new ActivityStore({
      inactiveThresholdMs: 1000, // 1 second for testing
      removeEndedSessionsMs: 500, // 0.5 seconds for testing
    });
  });

  // Helper to create test events
  const createSessionStartEvent = (sessionId: string, timestamp?: string): SessionStartEvent => ({
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
      lc_terminal: 'iTerm2',
      lc_terminal_version: '3.4.0',
      iterm: {
        session_id: 'w0t0p0:test',
        profile: 'Default',
        tab_name: 'Test Tab',
        window_name: 'Test Window',
      },
    },
    docker: {
      is_container: false,
      container_id: 'unknown',
      container_name: 'unknown',
    },
    git: {
      is_repo: false,
      branch: 'unknown',
      is_worktree: false,
      is_dirty: false,
      repo_name: 'unknown',
    },
    timestamp: timestamp || new Date().toISOString(),
  });

  const createSessionEndEvent = (sessionId: string, timestamp?: string): SessionEndEvent => ({
    ...createSessionStartEvent(sessionId, timestamp),
    event_type: 'session_end',
  });

  const createActivityEvent = (
    sessionId: string,
    activityType: ActivityEvent['activity_type'],
    timestamp?: string,
    extras?: Partial<ActivityEvent>
  ): ActivityEvent => ({
    event_type: 'activity',
    activity_type: activityType,
    session_id: sessionId,
    timestamp: timestamp || new Date().toISOString(),
    ...extras,
  });

  describe('SESSION_START', () => {
    it('should create a new session with awaitingInput: false', () => {
      const event = createSessionStartEvent('session-1');
      store.dispatch(actions.sessionStart(event));

      const session = store.getSession('session-1');
      expect(session).toBeDefined();
      expect(session?.awaitingInput).toBe(false);
      expect(session?.status).toBe('active');
    });

    it('should initialize all required session fields', () => {
      const event = createSessionStartEvent('session-1', '2025-10-17T00:00:00Z');
      store.dispatch(actions.sessionStart(event));

      const session = store.getSession('session-1');
      expect(session).toMatchObject({
        id: 'session-1',
        cwd: '/test/dir-session-1',
        transcriptPath: '/test/transcript-session-1.json',
        status: 'active',
        awaitingInput: false,
      });
      expect(session?.startTime.toISOString()).toBe('2025-10-17T00:00:00.000Z');
    });
  });

  describe('ACTIVITY_STOP - Awaiting Input', () => {
    it('should set awaitingInput: true when agent stops responding', () => {
      const startEvent = createSessionStartEvent('session-1');
      store.dispatch(actions.sessionStart(startEvent));

      const stopEvent = createActivityEvent('session-1', 'stop');
      store.dispatch(actions.activityStop(stopEvent));

      const session = store.getSession('session-1');
      expect(session?.awaitingInput).toBe(true);
      expect(session?.notificationMessage).toBe('Awaiting user input');
    });

    it('should keep session status as active when awaiting input', () => {
      const startEvent = createSessionStartEvent('session-1');
      store.dispatch(actions.sessionStart(startEvent));

      const stopEvent = createActivityEvent('session-1', 'stop');
      store.dispatch(actions.activityStop(stopEvent));

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.awaitingInput).toBe(true);
    });

    it('should update lastActivityTime on stop', () => {
      const startEvent = createSessionStartEvent('session-1', '2025-10-17T00:00:00Z');
      store.dispatch(actions.sessionStart(startEvent));

      const stopEvent = createActivityEvent('session-1', 'stop', '2025-10-17T00:01:00Z');
      store.dispatch(actions.activityStop(stopEvent));

      const session = store.getSession('session-1');
      expect(session?.lastActivityTime.toISOString()).toBe('2025-10-17T00:01:00.000Z');
    });

    it('should re-activate ended sessions when activity resumes', () => {
      const startEvent = createSessionStartEvent('session-1');
      const endEvent = createSessionEndEvent('session-1');
      store.dispatch(actions.sessionStart(startEvent));
      store.dispatch(actions.sessionEnd(endEvent));

      expect(store.getSession('session-1')?.status).toBe('ended');

      // New activity should re-activate the session
      const stopEvent = createActivityEvent('session-1', 'stop');
      store.dispatch(actions.activityStop(stopEvent));

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.awaitingInput).toBe(true);
      expect(session?.endTime).toBeUndefined();
    });

    it('should handle stop event on non-existent session gracefully', () => {
      const stopEvent = createActivityEvent('non-existent', 'stop');
      store.dispatch(actions.activityStop(stopEvent));

      expect(store.getSessions()).toHaveLength(0);
    });
  });

  describe('ACTIVITY_PROMPT_SUBMIT - Clearing Awaiting Input', () => {
    it('should clear awaitingInput when user submits prompt', () => {
      const startEvent = createSessionStartEvent('session-1');
      const stopEvent = createActivityEvent('session-1', 'stop');
      store.dispatch(actions.sessionStart(startEvent));
      store.dispatch(actions.activityStop(stopEvent));

      expect(store.getSession('session-1')?.awaitingInput).toBe(true);

      const promptEvent = createActivityEvent('session-1', 'prompt_submit');
      store.dispatch(actions.activityPromptSubmit(promptEvent));

      const session = store.getSession('session-1');
      expect(session?.awaitingInput).toBe(false);
      expect(session?.notificationMessage).toBeUndefined();
    });

    it('should clear notificationMessage on prompt submit', () => {
      const startEvent = createSessionStartEvent('session-1');
      const stopEvent = createActivityEvent('session-1', 'stop');
      store.dispatch(actions.sessionStart(startEvent));
      store.dispatch(actions.activityStop(stopEvent));

      expect(store.getSession('session-1')?.notificationMessage).toBe('Awaiting user input');

      const promptEvent = createActivityEvent('session-1', 'prompt_submit');
      store.dispatch(actions.activityPromptSubmit(promptEvent));

      expect(store.getSession('session-1')?.notificationMessage).toBeUndefined();
    });
  });

  describe('ACTIVITY_TOOL_USE - Clearing Awaiting Input', () => {
    it('should clear awaitingInput when agent uses tool', () => {
      const startEvent = createSessionStartEvent('session-1');
      const stopEvent = createActivityEvent('session-1', 'stop');
      store.dispatch(actions.sessionStart(startEvent));
      store.dispatch(actions.activityStop(stopEvent));

      expect(store.getSession('session-1')?.awaitingInput).toBe(true);

      const toolEvent = createActivityEvent('session-1', 'tool_use', undefined, { tool_name: 'Bash' });
      store.dispatch(actions.activityToolUse(toolEvent));

      const session = store.getSession('session-1');
      expect(session?.awaitingInput).toBe(false);
      expect(session?.notificationMessage).toBeUndefined();
    });

    it('should handle multiple stop/resume cycles', () => {
      const startEvent = createSessionStartEvent('session-1');
      store.dispatch(actions.sessionStart(startEvent));

      // Cycle 1: Stop -> Tool Use
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
      expect(store.getSession('session-1')?.awaitingInput).toBe(true);

      store.dispatch(actions.activityToolUse(createActivityEvent('session-1', 'tool_use')));
      expect(store.getSession('session-1')?.awaitingInput).toBe(false);

      // Cycle 2: Stop -> Prompt Submit
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
      expect(store.getSession('session-1')?.awaitingInput).toBe(true);

      store.dispatch(actions.activityPromptSubmit(createActivityEvent('session-1', 'prompt_submit')));
      expect(store.getSession('session-1')?.awaitingInput).toBe(false);
    });
  });

  describe('ACTIVITY_NOTIFICATION - Alternative Awaiting Trigger', () => {
    it('should set awaitingInput on notification event', () => {
      const startEvent = createSessionStartEvent('session-1');
      store.dispatch(actions.sessionStart(startEvent));

      const notificationEvent = createActivityEvent('session-1', 'notification', undefined, {
        notification_message: 'Permission required',
      });
      store.dispatch(actions.activityNotification(notificationEvent));

      const session = store.getSession('session-1');
      expect(session?.awaitingInput).toBe(true);
      expect(session?.notificationMessage).toBe('Permission required');
    });
  });

  describe('Sorting Priority - Awaiting Input Sessions', () => {
    it('should sort awaiting-input sessions before active sessions', () => {
      // Create 3 sessions
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-2')));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-3')));

      // Make session-2 await input
      store.dispatch(actions.activityStop(createActivityEvent('session-2', 'stop')));

      const sessions = store.getSessions();
      expect(sessions[0].id).toBe('session-2'); // awaiting input at top
      expect(sessions[0].awaitingInput).toBe(true);
    });

    it('should maintain sort order: awaiting > active > inactive > ended', () => {
      const now = Date.now();

      // Create sessions with different states
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-active', new Date(now - 500).toISOString())));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-awaiting', new Date(now - 1000).toISOString())));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-inactive', new Date(now - 2000).toISOString())));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-ended', new Date(now - 3000).toISOString())));

      // Set states
      store.dispatch(actions.activityStop(createActivityEvent('session-awaiting', 'stop')));
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-ended')));
      store.updateSessionStatuses(); // Mark session-inactive as inactive

      const sessions = store.getSessions();
      expect(sessions[0].id).toBe('session-awaiting');
      expect(sessions[0].awaitingInput).toBe(true);

      expect(sessions[1].id).toBe('session-active');
      expect(sessions[1].status).toBe('active');

      expect(sessions[2].id).toBe('session-inactive');
      expect(sessions[2].status).toBe('inactive');

      expect(sessions[3].id).toBe('session-ended');
      expect(sessions[3].status).toBe('ended');
    });

    it('should sort multiple awaiting-input sessions by recent activity', () => {
      const now = Date.now();

      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1', new Date(now - 3000).toISOString())));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-2', new Date(now - 2000).toISOString())));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-3', new Date(now - 1000).toISOString())));

      // Make all await input
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop', new Date(now - 2500).toISOString())));
      store.dispatch(actions.activityStop(createActivityEvent('session-2', 'stop', new Date(now - 1500).toISOString())));
      store.dispatch(actions.activityStop(createActivityEvent('session-3', 'stop', new Date(now - 500).toISOString())));

      const sessions = store.getSessions();
      expect(sessions[0].id).toBe('session-3'); // most recent awaiting
      expect(sessions[1].id).toBe('session-2');
      expect(sessions[2].id).toBe('session-1');
    });
  });

  describe('Session Counts - Awaiting Input', () => {
    it('should count awaiting-input sessions correctly', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-2')));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-3')));

      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
      store.dispatch(actions.activityStop(createActivityEvent('session-2', 'stop')));

      const counts = store.getSessionCounts();
      expect(counts.awaitingInput).toBe(2);
      expect(counts.active).toBe(3);
      expect(counts.total).toBe(3);
    });

    it('should update awaiting count when state changes', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));

      expect(store.getSessionCounts().awaitingInput).toBe(1);

      store.dispatch(actions.activityPromptSubmit(createActivityEvent('session-1', 'prompt_submit')));

      expect(store.getSessionCounts().awaitingInput).toBe(0);
    });

    it('should count mixed session states correctly', () => {
      const now = Date.now();

      // Active (not awaiting)
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-active')));

      // Awaiting input
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-awaiting')));
      store.dispatch(actions.activityStop(createActivityEvent('session-awaiting', 'stop')));

      // Inactive (old timestamp, not awaiting)
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-inactive', new Date(now - 2000).toISOString())));

      // Ended
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-ended')));
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-ended')));

      store.updateSessionStatuses();

      const counts = store.getSessionCounts();
      expect(counts.awaitingInput).toBe(1);
      expect(counts.active).toBe(2); // active + awaiting
      expect(counts.inactive).toBe(1);
      expect(counts.ended).toBe(1);
      expect(counts.total).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle awaiting state persisting through status updates', () => {
      const now = Date.now();

      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1', new Date(now - 2000).toISOString())));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop', new Date(now - 1500).toISOString())));

      expect(store.getSession('session-1')?.awaitingInput).toBe(true);

      // Update statuses (should mark as inactive but keep awaiting)
      store.updateSessionStatuses();

      const session = store.getSession('session-1');
      expect(session?.status).toBe('inactive');
      expect(session?.awaitingInput).toBe(true); // Should persist
    });

    it('should handle rapid stop/start cycles', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));

      // Rapid cycles
      for (let i = 0; i < 5; i++) {
        store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
        expect(store.getSession('session-1')?.awaitingInput).toBe(true);

        store.dispatch(actions.activityToolUse(createActivityEvent('session-1', 'tool_use')));
        expect(store.getSession('session-1')?.awaitingInput).toBe(false);
      }
    });

    it('should track activity events in recent activity list', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
      store.dispatch(actions.activityPromptSubmit(createActivityEvent('session-1', 'prompt_submit')));

      const recentActivity = store.getRecentActivity();
      expect(recentActivity).toHaveLength(2); // stop + prompt_submit (not session_start)
      expect(recentActivity[0].activity_type).toBe('prompt_submit');
      expect(recentActivity[1].activity_type).toBe('stop');
    });

    it('should not affect other sessions when setting awaiting state', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-2')));

      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));

      expect(store.getSession('session-1')?.awaitingInput).toBe(true);
      expect(store.getSession('session-2')?.awaitingInput).toBe(false);
    });
  });

  describe('Reducer Statistics', () => {
    it('should track event counts by type', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));
      store.dispatch(actions.activityPromptSubmit(createActivityEvent('session-1', 'prompt_submit')));

      const stats = store.getStats();
      expect(stats.totalEvents).toBe(4);
      expect(stats.eventsByType.SESSION_START).toBe(1);
      expect(stats.eventsByType.ACTIVITY_STOP).toBe(2);
      expect(stats.eventsByType.ACTIVITY_PROMPT_SUBMIT).toBe(1);
    });
  });

  describe('State Management', () => {
    it('should notify listeners on state changes', () => {
      let notificationCount = 0;
      store.subscribe(() => notificationCount++);

      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));

      expect(notificationCount).toBe(2);
    });

    it('should clear all state', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.activityStop(createActivityEvent('session-1', 'stop')));

      expect(store.getSessions()).toHaveLength(1);

      store.clear();

      expect(store.getSessions()).toHaveLength(0);
      expect(store.getStats().totalEvents).toBe(0);
    });
  });

  describe('Session Re-activation', () => {
    it('should re-activate ended session on ACTIVITY_TOOL_USE', () => {
      const startEvent = createSessionStartEvent('session-1', '2025-10-22T12:30:00Z');
      const endEvent = createSessionEndEvent('session-1', '2025-10-22T12:45:00Z');

      store.dispatch(actions.sessionStart(startEvent));
      store.dispatch(actions.sessionEnd(endEvent));

      expect(store.getSession('session-1')?.status).toBe('ended');
      expect(store.getSession('session-1')?.endTime).toBeDefined();

      // Session re-opens, activity resumes
      const toolEvent = createActivityEvent('session-1', 'tool_use', '2025-10-22T12:50:00Z', {
        tool_name: 'Read'
      });
      store.dispatch(actions.activityToolUse(toolEvent));

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.endTime).toBeUndefined();
      expect(session?.awaitingInput).toBe(false);
      expect(session?.lastActivityTime.toISOString()).toBe('2025-10-22T12:50:00.000Z');
    });

    it('should re-activate ended session on ACTIVITY_PROMPT_SUBMIT', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1')));

      expect(store.getSession('session-1')?.status).toBe('ended');

      const promptEvent = createActivityEvent('session-1', 'prompt_submit');
      store.dispatch(actions.activityPromptSubmit(promptEvent));

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.endTime).toBeUndefined();
    });

    it('should re-activate ended session on ACTIVITY_NOTIFICATION', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1')));

      const notificationEvent = createActivityEvent('session-1', 'notification', undefined, {
        notification_message: 'Awaiting user input'
      });
      store.dispatch(actions.activityNotification(notificationEvent));

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.endTime).toBeUndefined();
      expect(session?.awaitingInput).toBe(true);
    });

    it('should re-activate ended session on ACTIVITY_SUBAGENT_STOP', () => {
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1')));
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1')));

      const subagentEvent = createActivityEvent('session-1', 'subagent_stop');
      store.dispatch(actions.activitySubagentStop(subagentEvent));

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.endTime).toBeUndefined();
    });

    it('should handle multiple end/reactivate cycles', () => {
      const now = Date.now();

      // Start session
      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1', new Date(now).toISOString())));

      // First cycle: end and reactivate
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1', new Date(now + 1000).toISOString())));
      expect(store.getSession('session-1')?.status).toBe('ended');

      store.dispatch(actions.activityToolUse(createActivityEvent('session-1', 'tool_use', new Date(now + 2000).toISOString())));
      expect(store.getSession('session-1')?.status).toBe('active');

      // Second cycle: end and reactivate again
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1', new Date(now + 3000).toISOString())));
      expect(store.getSession('session-1')?.status).toBe('ended');

      store.dispatch(actions.activityPromptSubmit(createActivityEvent('session-1', 'prompt_submit', new Date(now + 4000).toISOString())));
      expect(store.getSession('session-1')?.status).toBe('active');
    });

    it('should update transcript activity for ended sessions', () => {
      const now = new Date('2025-10-22T12:30:00Z');

      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1', now.toISOString())));
      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1', new Date(now.getTime() + 60000).toISOString())));

      expect(store.getSession('session-1')?.status).toBe('ended');

      // Transcript shows activity after session ended (session was re-opened)
      const newTimestamp = new Date(now.getTime() + 120000);
      store.updateSessionActivityFromTranscript('session-1', newTimestamp);

      const session = store.getSession('session-1');
      expect(session?.status).toBe('active');
      expect(session?.endTime).toBeUndefined();
      expect(session?.lastActivityTime.toISOString()).toBe(newTimestamp.toISOString());
    });

    it('should not update if transcript timestamp is older than last activity', () => {
      const now = new Date('2025-10-22T12:30:00Z');

      store.dispatch(actions.sessionStart(createSessionStartEvent('session-1', now.toISOString())));

      // Add some activity to move lastActivityTime forward
      const lastActivityTime = new Date(now.getTime() + 60000);
      store.dispatch(actions.activityToolUse(createActivityEvent('session-1', 'tool_use', lastActivityTime.toISOString())));

      store.dispatch(actions.sessionEnd(createSessionEndEvent('session-1', new Date(now.getTime() + 70000).toISOString())));

      // Transcript timestamp is older than last activity (30s vs 60s)
      const oldTimestamp = new Date(now.getTime() + 30000);
      store.updateSessionActivityFromTranscript('session-1', oldTimestamp);

      const session = store.getSession('session-1');
      expect(session?.status).toBe('ended'); // Should remain ended because timestamp is old
      expect(session?.lastActivityTime.toISOString()).toBe(lastActivityTime.toISOString()); // Should keep the last activity time (tool use)
    });
  });
});
