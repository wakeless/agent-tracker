import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import { join } from 'path';
import { TranscriptWatcher } from './TranscriptWatcher.js';
import { TranscriptEntry } from '../types/transcript.js';

describe('TranscriptWatcher', () => {
  const testDir = join(process.cwd(), 'test-data-transcript');
  const testTranscriptPath = join(testDir, 'test-transcript.jsonl');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    // Clean up test transcript file
    if (fs.existsSync(testTranscriptPath)) {
      fs.unlinkSync(testTranscriptPath);
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should start watching an existing transcript file', () => {
    // Create transcript file first
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    // Should not throw errors when starting
    expect(() => watcher.start()).not.toThrow();
    expect(watcher.getTranscriptPath()).toBe(testTranscriptPath);

    watcher.stop();
  });

  it('should read and process new user entries', () => {
    // Create initial transcript file
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    watcher.start();

    // Append a user entry
    const userEntry: TranscriptEntry = {
      parentUuid: null,
      isSidechain: false,
      userType: 'user',
      cwd: '/test/dir',
      sessionId: 'test-session-123',
      version: '1.0.0',
      type: 'user',
      message: {
        role: 'user',
        content: 'Hello, Claude!',
      },
      uuid: 'user-uuid-1',
      timestamp: '2025-10-16T00:00:00Z',
    };

    fs.appendFileSync(testTranscriptPath, JSON.stringify(userEntry) + '\n');

    // Manually trigger read for testing
    watcher.readNewEntries();

    expect(onNewEntries).toHaveBeenCalledTimes(1);
    const entries = onNewEntries.mock.calls[0][0];
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('user');
    expect(entries[0].content).toBe('Hello, Claude!');

    watcher.stop();
  });

  it('should read and process new assistant entries', () => {
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    watcher.start();

    // Append an assistant entry
    const assistantEntry: TranscriptEntry = {
      parentUuid: 'user-uuid-1',
      isSidechain: false,
      userType: 'assistant',
      cwd: '/test/dir',
      sessionId: 'test-session-123',
      version: '1.0.0',
      type: 'assistant',
      message: {
        model: 'claude-3-5-sonnet-20241022',
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Hello! How can I help you?',
          },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          output_tokens: 50,
          service_tier: 'default',
        },
      },
      uuid: 'assistant-uuid-1',
      timestamp: '2025-10-16T00:00:01Z',
    };

    fs.appendFileSync(testTranscriptPath, JSON.stringify(assistantEntry) + '\n');

    // Manually trigger read
    watcher.readNewEntries();

    expect(onNewEntries).toHaveBeenCalledTimes(1);
    const entries = onNewEntries.mock.calls[0][0];
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('assistant');
    expect(entries[0].content).toContain('Hello! How can I help you?');

    watcher.stop();
  });

  it('should handle multiple entries in sequence', () => {
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    watcher.start();

    // Append multiple entries
    const entries: TranscriptEntry[] = [
      {
        parentUuid: null,
        isSidechain: false,
        userType: 'user',
        cwd: '/test/dir',
        sessionId: 'test-session-123',
        version: '1.0.0',
        type: 'user',
        message: {
          role: 'user',
          content: 'First message',
        },
        uuid: 'uuid-1',
        timestamp: '2025-10-16T00:00:00Z',
      },
      {
        parentUuid: 'uuid-1',
        isSidechain: false,
        userType: 'user',
        cwd: '/test/dir',
        sessionId: 'test-session-123',
        version: '1.0.0',
        type: 'user',
        message: {
          role: 'user',
          content: 'Second message',
        },
        uuid: 'uuid-2',
        timestamp: '2025-10-16T00:00:01Z',
      },
    ];

    entries.forEach(entry => {
      fs.appendFileSync(testTranscriptPath, JSON.stringify(entry) + '\n');
    });

    // Manually trigger read
    watcher.readNewEntries();

    expect(onNewEntries).toHaveBeenCalledTimes(1);
    const parsedEntries = onNewEntries.mock.calls[0][0];
    expect(parsedEntries).toHaveLength(2);
    expect(parsedEntries[0].content).toBe('First message');
    expect(parsedEntries[1].content).toBe('Second message');

    watcher.stop();
  });

  it('should track lastPosition correctly across multiple reads', () => {
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    watcher.start();

    // First batch of entries
    const entry1: TranscriptEntry = {
      parentUuid: null,
      isSidechain: false,
      userType: 'user',
      cwd: '/test/dir',
      sessionId: 'test-session-123',
      version: '1.0.0',
      type: 'user',
      message: {
        role: 'user',
        content: 'First',
      },
      uuid: 'uuid-1',
      timestamp: '2025-10-16T00:00:00Z',
    };

    fs.appendFileSync(testTranscriptPath, JSON.stringify(entry1) + '\n');
    watcher.readNewEntries();

    expect(onNewEntries).toHaveBeenCalledTimes(1);
    expect(onNewEntries.mock.calls[0][0]).toHaveLength(1);

    // Second batch - should only get new entries
    const entry2: TranscriptEntry = {
      ...entry1,
      uuid: 'uuid-2',
      message: {
        role: 'user',
        content: 'Second',
      },
      timestamp: '2025-10-16T00:00:01Z',
    };

    fs.appendFileSync(testTranscriptPath, JSON.stringify(entry2) + '\n');
    watcher.readNewEntries();

    expect(onNewEntries).toHaveBeenCalledTimes(2);
    expect(onNewEntries.mock.calls[1][0]).toHaveLength(1);
    expect(onNewEntries.mock.calls[1][0][0].content).toBe('Second');

    watcher.stop();
  });

  it('should handle errors in entry parsing', () => {
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const onError = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries, onError });

    watcher.start();

    // Write invalid JSON
    fs.appendFileSync(testTranscriptPath, 'invalid json\n');

    // Manually trigger read
    watcher.readNewEntries();

    expect(onError).toHaveBeenCalled();
    expect(onNewEntries).not.toHaveBeenCalled();

    watcher.stop();
  });

  it('should filter out entries with no meaningful content', () => {
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    watcher.start();

    // Entry with empty content (should be filtered)
    const emptyEntry: TranscriptEntry = {
      parentUuid: null,
      isSidechain: false,
      userType: 'user',
      cwd: '/test/dir',
      sessionId: 'test-session-123',
      version: '1.0.0',
      type: 'user',
      message: {
        role: 'user',
        content: '   ',
      },
      uuid: 'uuid-empty',
      timestamp: '2025-10-16T00:00:00Z',
    };

    fs.appendFileSync(testTranscriptPath, JSON.stringify(emptyEntry) + '\n');
    watcher.readNewEntries();

    // Should not emit any entries
    expect(onNewEntries).not.toHaveBeenCalled();

    watcher.stop();
  });

  it('should prevent concurrent reads', () => {
    fs.writeFileSync(testTranscriptPath, '');

    const onNewEntries = vi.fn();
    const watcher = new TranscriptWatcher(testTranscriptPath, { onNewEntries });

    watcher.start();

    // Append entry
    const entry: TranscriptEntry = {
      parentUuid: null,
      isSidechain: false,
      userType: 'user',
      cwd: '/test/dir',
      sessionId: 'test-session-123',
      version: '1.0.0',
      type: 'user',
      message: {
        role: 'user',
        content: 'Test',
      },
      uuid: 'uuid-1',
      timestamp: '2025-10-16T00:00:00Z',
    };

    fs.appendFileSync(testTranscriptPath, JSON.stringify(entry) + '\n');

    // Trigger multiple concurrent reads
    watcher.readNewEntries();
    watcher.readNewEntries();
    watcher.readNewEntries();

    // Should only process once
    expect(onNewEntries).toHaveBeenCalledTimes(1);

    watcher.stop();
  });
});
