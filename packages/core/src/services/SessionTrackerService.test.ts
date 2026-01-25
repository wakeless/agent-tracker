import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionTrackerService } from './SessionTrackerService.js';
import { SessionStartEvent, SessionEndEvent, ActivityEvent } from '../types/events.js';
import * as fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('SessionTrackerService', () => {
  let service: SessionTrackerService;
  let tempEventsFile: string;

  beforeEach(() => {
    // Always use tmpdir() to avoid touching user's real sessions file
    tempEventsFile = join(tmpdir(), `test-events-${Date.now()}.jsonl`);

    service = new SessionTrackerService({
      eventsFilePath: tempEventsFile,
      enableLogging: false,
      inactiveThresholdMs: 1000,
      removeEndedSessionsMs: 500,
    });
  });

  afterEach(() => {
    service.stop();
    if (fs.existsSync(tempEventsFile)) {
      fs.unlinkSync(tempEventsFile);
    }
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

  // Helper to write events to the temp file
  const writeEvent = (event: SessionStartEvent | SessionEndEvent | ActivityEvent) => {
    fs.appendFileSync(tempEventsFile, JSON.stringify(event) + '\n');
  };

  describe('Service Initialization', () => {
    it('should initialize without errors', () => {
      expect(service).toBeDefined();
      expect(service.isStarted()).toBe(false);
    });

    it('should initialize with default options', () => {
      // IMPORTANT: Always use temp file to avoid touching real sessions file
      const safeTempFile = join(tmpdir(), `test-default-${Date.now()}.jsonl`);
      const defaultService = new SessionTrackerService({ eventsFilePath: safeTempFile });
      expect(defaultService).toBeDefined();
      expect(defaultService.getSessions()).toEqual([]);
      defaultService.stop();

      // Cleanup
      if (fs.existsSync(safeTempFile)) {
        fs.unlinkSync(safeTempFile);
      }
    });

    it('should initialize with custom events file path', () => {
      const customPath = join(tmpdir(), `test-custom-${Date.now()}.jsonl`);
      const customService = new SessionTrackerService({ eventsFilePath: customPath });
      expect(customService).toBeDefined();
      customService.stop();

      // Cleanup
      if (fs.existsSync(customPath)) {
        fs.unlinkSync(customPath);
      }
    });
  });

  describe('Lifecycle Management', () => {
    it('should start watching for events', () => {
      expect(service.isStarted()).toBe(false);
      service.start();
      expect(service.isStarted()).toBe(true);
    });

    it('should stop watching for events', () => {
      service.start();
      expect(service.isStarted()).toBe(true);
      service.stop();
      expect(service.isStarted()).toBe(false);
    });

    it('should be idempotent when starting multiple times', () => {
      service.start();
      service.start();
      service.start();
      expect(service.isStarted()).toBe(true);
    });

    it('should be idempotent when stopping multiple times', () => {
      service.start();
      service.stop();
      service.stop();
      service.stop();
      expect(service.isStarted()).toBe(false);
    });

    it('should check if events file exists', () => {
      // File doesn't exist initially
      expect(service.fileExists()).toBe(false);

      // Start creates the file
      service.start();
      expect(service.fileExists()).toBe(true);
    });
  });

  describe('Session Data Access', () => {
    it('should return empty sessions initially', () => {
      expect(service.getSessions()).toEqual([]);
    });

    it('should return session counts', () => {
      const counts = service.getSessionCounts();
      expect(counts).toEqual({
        total: 0,
        active: 0,
        inactive: 0,
        ended: 0,
        awaitingInput: 0,
      });
    });

    it('should return sessions after processing events', () => {
      service.start();

      // Write a session start event
      const event = createSessionStartEvent('session-1');
      writeEvent(event);

      // Wait a bit for file watcher to process
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions).toHaveLength(1);
          expect(sessions[0].id).toBe('session-1');
          resolve();
        }, 100);
      });
    });
  });

  describe('Event Processing - Session Start', () => {
    it('should process session_start events', () => {
      service.start();

      const event = createSessionStartEvent('session-1');
      writeEvent(event);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions).toHaveLength(1);
          expect(sessions[0]).toMatchObject({
            id: 'session-1',
            cwd: '/test/dir-session-1',
            transcriptPath: '/test/transcript-session-1.json',
            status: 'active',
            awaitingInput: false,
          });
          resolve();
        }, 100);
      });
    });

    it('should create multiple sessions', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createSessionStartEvent('session-2'));
      writeEvent(createSessionStartEvent('session-3'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions).toHaveLength(3);
          expect(sessions.map(s => s.id).sort()).toEqual(['session-1', 'session-2', 'session-3']);
          resolve();
        }, 100);
      });
    });
  });

  describe('Event Processing - Session End', () => {
    it('should process session_end events', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Session should be active
          expect(service.getSessions()[0].status).toBe('active');

          // End the session
          writeEvent(createSessionEndEvent('session-1'));

          setTimeout(() => {
            const sessions = service.getSessions();
            expect(sessions).toHaveLength(1);
            expect(sessions[0].status).toBe('ended');
            resolve();
          }, 100);
        }, 100);
      });
    });
  });

  describe('Event Processing - Activity Events', () => {
    it('should process tool_use activity events', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createActivityEvent('session-1', 'tool_use', undefined, { tool_name: 'Bash' }));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions).toHaveLength(1);
          // Activity time should be updated
          expect(sessions[0].lastActivityTime).toBeDefined();
          resolve();
        }, 100);
      });
    });

    it('should process stop activity events and set awaitingInput', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createActivityEvent('session-1', 'stop'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions[0].awaitingInput).toBe(true);
          resolve();
        }, 100);
      });
    });

    it('should process prompt_submit events and clear awaitingInput', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createActivityEvent('session-1', 'stop'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(service.getSessions()[0].awaitingInput).toBe(true);

          writeEvent(createActivityEvent('session-1', 'prompt_submit'));

          setTimeout(() => {
            expect(service.getSessions()[0].awaitingInput).toBe(false);
            resolve();
          }, 100);
        }, 100);
      });
    });

    it('should process notification events', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createActivityEvent('session-1', 'notification', undefined, {
        notification_message: 'Test notification',
      }));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions[0].awaitingInput).toBe(true);
          expect(sessions[0].notificationMessage).toBe('Test notification');
          resolve();
        }, 100);
      });
    });

    it('should process subagent_stop events', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createActivityEvent('session-1', 'subagent_stop'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions).toHaveLength(1);
          // Should update activity time
          expect(sessions[0].lastActivityTime).toBeDefined();
          resolve();
        }, 100);
      });
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on state changes', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      service.start();
      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(listener).toHaveBeenCalled();
          unsubscribe();
          resolve();
        }, 100);
      });
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      service.start();
      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const callCount = listener.mock.calls.length;
          expect(callCount).toBeGreaterThan(0);

          // Unsubscribe
          unsubscribe();

          // Write another event
          writeEvent(createSessionStartEvent('session-2'));

          setTimeout(() => {
            // Should not have been called again
            expect(listener.mock.calls.length).toBe(callCount);
            resolve();
          }, 100);
        }, 100);
      });
    });

    it('should support multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.subscribe(listener1);
      service.subscribe(listener2);

      service.start();
      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();
          resolve();
        }, 100);
      });
    });

    it('should allow independent unsubscribe for multiple subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = service.subscribe(listener1);
      service.subscribe(listener2);

      service.start();
      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(listener1).toHaveBeenCalled();
          expect(listener2).toHaveBeenCalled();

          listener1.mockClear();
          listener2.mockClear();

          // Unsubscribe listener1 only
          unsubscribe1();

          writeEvent(createSessionStartEvent('session-2'));

          setTimeout(() => {
            expect(listener1).not.toHaveBeenCalled();
            expect(listener2).toHaveBeenCalled();
            resolve();
          }, 100);
        }, 100);
      });
    });
  });

  describe('Manual Status Updates', () => {
    it('should manually update session statuses', () => {
      service.start();

      // Create an old session
      const oldTimestamp = new Date(Date.now() - 5000).toISOString();
      writeEvent(createSessionStartEvent('session-1', oldTimestamp));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Should be active initially
          expect(service.getSessions()[0].status).toBe('active');

          // Manually update statuses
          service.updateSessionStatuses();

          // Should now be inactive (old timestamp + inactiveThresholdMs passed)
          expect(service.getSessions()[0].status).toBe('inactive');
          resolve();
        }, 100);
      });
    });

    it('should manually update session activity from transcript', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const originalActivityTime = service.getSessions()[0].lastActivityTime;

          // Simulate transcript having newer activity
          const newActivityTime = new Date(Date.now() + 1000);
          service.updateSessionActivityFromTranscript('session-1', newActivityTime);

          const updatedActivityTime = service.getSessions()[0].lastActivityTime;
          expect(updatedActivityTime.getTime()).toBeGreaterThan(originalActivityTime.getTime());
          resolve();
        }, 100);
      });
    });
  });

  describe('Session Counts', () => {
    it('should track session counts correctly', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createSessionStartEvent('session-2'));
      writeEvent(createSessionStartEvent('session-3'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const counts = service.getSessionCounts();
          expect(counts.total).toBe(3);
          expect(counts.active).toBe(3);
          expect(counts.inactive).toBe(0);
          expect(counts.ended).toBe(0);
          resolve();
        }, 100);
      });
    });

    it('should track awaiting input sessions in counts', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createSessionStartEvent('session-2'));
      writeEvent(createActivityEvent('session-1', 'stop'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const counts = service.getSessionCounts();
          expect(counts.awaitingInput).toBe(1);
          expect(counts.total).toBe(2);
          resolve();
        }, 100);
      });
    });

    it('should update counts when sessions end', () => {
      service.start();

      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createSessionStartEvent('session-2'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(service.getSessionCounts().active).toBe(2);

          writeEvent(createSessionEndEvent('session-1'));

          setTimeout(() => {
            const counts = service.getSessionCounts();
            expect(counts.active).toBe(1);
            expect(counts.ended).toBe(1);
            expect(counts.total).toBe(2);
            resolve();
          }, 100);
        }, 100);
      });
    });
  });

  describe('Integration: File Watching -> Event Processing -> State Updates', () => {
    it('should process events in real-time as file changes', () => {
      const listener = vi.fn();
      service.subscribe(listener);
      service.start();

      // Write events one by one with small delays
      writeEvent(createSessionStartEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(service.getSessions()).toHaveLength(1);
          expect(listener).toHaveBeenCalled();

          writeEvent(createSessionStartEvent('session-2'));

          setTimeout(() => {
            expect(service.getSessions()).toHaveLength(2);
            expect(listener.mock.calls.length).toBeGreaterThan(1);
            resolve();
          }, 100);
        }, 100);
      });
    });

    it('should handle rapid event sequences', () => {
      service.start();

      // Write multiple events rapidly
      writeEvent(createSessionStartEvent('session-1'));
      writeEvent(createActivityEvent('session-1', 'tool_use'));
      writeEvent(createActivityEvent('session-1', 'stop'));
      writeEvent(createActivityEvent('session-1', 'prompt_submit'));
      writeEvent(createSessionEndEvent('session-1'));

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const sessions = service.getSessions();
          expect(sessions).toHaveLength(1);
          expect(sessions[0].status).toBe('ended');
          resolve();
        }, 200);
      });
    });
  });
});
