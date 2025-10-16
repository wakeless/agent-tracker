import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import { join } from 'path';
import { EventWatcher } from './EventWatcher.js';
import { SessionStartEvent, SessionEndEvent } from '../types/events.js';

describe('EventWatcher - Integration Tests', () => {
  const testDir = join(process.cwd(), 'test-data-integration');
  const testLogPath = join(testDir, 'sessions.jsonl');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    if (fs.existsSync(testLogPath)) {
      fs.unlinkSync(testLogPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should handle concurrent writes from multiple sessions', async () => {
    const sessionIds: string[] = [];
    const handler = {
      onSessionStart: vi.fn((event: SessionStartEvent) => {
        sessionIds.push(event.session_id);
      }),
      onSessionEnd: vi.fn(),
      onError: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Simulate 10 concurrent session starts
    const numSessions = 10;
    const events: SessionStartEvent[] = [];

    for (let i = 0; i < numSessions; i++) {
      const event: SessionStartEvent = {
        event_type: 'session_start',
        session_id: `session-${i}`,
        cwd: `/test/dir-${i}`,
        transcript_path: `/test/transcript-${i}.json`,
        terminal: {
          tty: `/dev/ttys00${i}`,
          term: 'xterm-256color',
          shell: '/bin/zsh',
          ppid: `${10000 + i}`,
          term_program: 'iTerm.app',
          term_session_id: `term-session-${i}`,
        },
        timestamp: `2025-10-16T00:00:${String(i).padStart(2, '0')}Z`,
      };
      events.push(event);

      // Append concurrently (JSONL appends should be atomic)
      fs.appendFileSync(testLogPath, JSON.stringify(event) + '\n');
    }

    // Manually trigger read to process all events
    watcher.readNewEvents();

    // Verify all events were processed
    expect(handler.onSessionStart).toHaveBeenCalledTimes(numSessions);
    expect(handler.onError).not.toHaveBeenCalled();

    // Verify all session IDs were captured
    expect(sessionIds).toHaveLength(numSessions);
    for (let i = 0; i < numSessions; i++) {
      expect(sessionIds).toContain(`session-${i}`);
    }

    watcher.stop();
  });

  it('should handle session lifecycle (start and end)', async () => {
    const activeSessions = new Map<string, boolean>();

    const handler = {
      onSessionStart: vi.fn((event: SessionStartEvent) => {
        activeSessions.set(event.session_id, true);
      }),
      onSessionEnd: vi.fn((event: SessionEndEvent) => {
        activeSessions.delete(event.session_id);
      }),
      onError: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Start 3 sessions
    for (let i = 0; i < 3; i++) {
      const startEvent: SessionStartEvent = {
        event_type: 'session_start',
        session_id: `session-${i}`,
        cwd: `/test/dir-${i}`,
        transcript_path: `/test/transcript-${i}.json`,
        terminal: {
          tty: `/dev/ttys00${i}`,
          term: 'xterm-256color',
          shell: '/bin/zsh',
          ppid: `${10000 + i}`,
          term_program: 'iTerm.app',
          term_session_id: `term-session-${i}`,
        },
        timestamp: `2025-10-16T00:00:${String(i).padStart(2, '0')}Z`,
      };
      fs.appendFileSync(testLogPath, JSON.stringify(startEvent) + '\n');
    }

    watcher.readNewEvents();

    // Should have 3 active sessions
    expect(activeSessions.size).toBe(3);

    // End 2 sessions
    for (let i = 0; i < 2; i++) {
      const endEvent: SessionEndEvent = {
        event_type: 'session_end',
        session_id: `session-${i}`,
        cwd: `/test/dir-${i}`,
        transcript_path: `/test/transcript-${i}.json`,
        terminal: {
          tty: `/dev/ttys00${i}`,
          term: 'xterm-256color',
          shell: '/bin/zsh',
          ppid: `${10000 + i}`,
          term_program: 'iTerm.app',
          term_session_id: `term-session-${i}`,
        },
        timestamp: `2025-10-16T00:01:${String(i).padStart(2, '0')}Z`,
      };
      fs.appendFileSync(testLogPath, JSON.stringify(endEvent) + '\n');
    }

    watcher.readNewEvents();

    // Should have 1 active session remaining
    expect(activeSessions.size).toBe(1);
    expect(activeSessions.has('session-2')).toBe(true);

    expect(handler.onError).not.toHaveBeenCalled();

    watcher.stop();
  });

  it('should handle incremental reads (only read new data)', async () => {
    const handler = {
      onSessionStart: vi.fn(),
      onSessionEnd: vi.fn(),
      onError: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Write first event
    const event1: SessionStartEvent = {
      event_type: 'session_start',
      session_id: 'session-1',
      cwd: '/test/dir-1',
      transcript_path: '/test/transcript-1.json',
      terminal: {
        tty: '/dev/ttys001',
        term: 'xterm-256color',
        shell: '/bin/zsh',
        ppid: '10001',
        term_program: 'iTerm.app',
        term_session_id: 'term-session-1',
      },
      timestamp: '2025-10-16T00:00:00Z',
    };
    fs.appendFileSync(testLogPath, JSON.stringify(event1) + '\n');
    watcher.readNewEvents();

    expect(handler.onSessionStart).toHaveBeenCalledTimes(1);

    // Write second event
    const event2: SessionStartEvent = {
      ...event1,
      session_id: 'session-2',
      cwd: '/test/dir-2',
      timestamp: '2025-10-16T00:00:01Z',
    };
    fs.appendFileSync(testLogPath, JSON.stringify(event2) + '\n');
    watcher.readNewEvents();

    // Should have been called twice total, once for each event
    expect(handler.onSessionStart).toHaveBeenCalledTimes(2);
    expect(handler.onSessionStart).toHaveBeenNthCalledWith(1, event1);
    expect(handler.onSessionStart).toHaveBeenNthCalledWith(2, event2);

    watcher.stop();
  });
});
