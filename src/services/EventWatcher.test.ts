import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import { join } from 'path';
import { EventWatcher } from './EventWatcher.js';
import { SessionStartEvent, SessionEndEvent } from '../types/events.js';

describe('EventWatcher', () => {
  const testDir = join(process.cwd(), 'test-data');
  const testLogPath = join(testDir, 'sessions.jsonl');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Clean up test log file
    if (fs.existsSync(testLogPath)) {
      fs.unlinkSync(testLogPath);
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create log file if it does not exist', () => {
    const handler = {
      onSessionStart: vi.fn(),
      onSessionEnd: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    expect(fs.existsSync(testLogPath)).toBe(true);

    watcher.stop();
  });

  it('should read and process session start events', async () => {
    const handler = {
      onSessionStart: vi.fn(),
      onSessionEnd: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Write a session start event
    const event: SessionStartEvent = {
      event_type: 'session_start',
      session_id: 'test-123',
      cwd: '/test/dir',
      transcript_path: '/test/transcript.json',
      terminal: {
        tty: '/dev/ttys001',
        term: 'xterm-256color',
        shell: '/bin/zsh',
        ppid: '12345',
        term_program: 'iTerm.app',
        term_session_id: 'test-session',
      },
      timestamp: '2025-10-16T00:00:00Z',
    };

    fs.appendFileSync(testLogPath, JSON.stringify(event) + '\n');

    // Manually trigger read for testing
    watcher.readNewEvents();

    expect(handler.onSessionStart).toHaveBeenCalledWith(event);
    expect(handler.onSessionEnd).not.toHaveBeenCalled();

    watcher.stop();
  });

  it('should read and process session end events', async () => {
    const handler = {
      onSessionStart: vi.fn(),
      onSessionEnd: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Write a session end event
    const event: SessionEndEvent = {
      event_type: 'session_end',
      session_id: 'test-123',
      cwd: '/test/dir',
      transcript_path: '/test/transcript.json',
      terminal: {
        tty: '/dev/ttys001',
        term: 'xterm-256color',
        shell: '/bin/zsh',
        ppid: '12345',
        term_program: 'iTerm.app',
        term_session_id: 'test-session',
      },
      timestamp: '2025-10-16T00:00:00Z',
    };

    fs.appendFileSync(testLogPath, JSON.stringify(event) + '\n');

    // Manually trigger read for testing
    watcher.readNewEvents();

    expect(handler.onSessionEnd).toHaveBeenCalledWith(event);
    expect(handler.onSessionStart).not.toHaveBeenCalled();

    watcher.stop();
  });

  it('should handle multiple events in sequence', async () => {
    const handler = {
      onSessionStart: vi.fn(),
      onSessionEnd: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Write multiple events
    const startEvent: SessionStartEvent = {
      event_type: 'session_start',
      session_id: 'test-123',
      cwd: '/test/dir',
      transcript_path: '/test/transcript.json',
      terminal: {
        tty: '/dev/ttys001',
        term: 'xterm-256color',
        shell: '/bin/zsh',
        ppid: '12345',
        term_program: 'iTerm.app',
        term_session_id: 'test-session',
      },
      timestamp: '2025-10-16T00:00:00Z',
    };

    const endEvent: SessionEndEvent = {
      ...startEvent,
      event_type: 'session_end',
      timestamp: '2025-10-16T00:01:00Z',
    };

    fs.appendFileSync(testLogPath, JSON.stringify(startEvent) + '\n');
    fs.appendFileSync(testLogPath, JSON.stringify(endEvent) + '\n');

    // Manually trigger read for testing
    watcher.readNewEvents();

    expect(handler.onSessionStart).toHaveBeenCalledTimes(1);
    expect(handler.onSessionEnd).toHaveBeenCalledTimes(1);

    watcher.stop();
  });

  it('should handle errors in event parsing', async () => {
    const handler = {
      onSessionStart: vi.fn(),
      onSessionEnd: vi.fn(),
      onError: vi.fn(),
    };

    const watcher = new EventWatcher(handler, testDir);
    watcher.start();

    // Write invalid JSON
    fs.appendFileSync(testLogPath, 'invalid json\n');

    // Manually trigger read for testing
    watcher.readNewEvents();

    expect(handler.onError).toHaveBeenCalled();
    expect(handler.onSessionStart).not.toHaveBeenCalled();
    expect(handler.onSessionEnd).not.toHaveBeenCalled();

    watcher.stop();
  });
});
