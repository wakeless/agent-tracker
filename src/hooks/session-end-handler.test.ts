/**
 * Tests for Session End Handler
 */

import { describe, it, expect } from 'vitest';
import { handleSessionEnd } from './session-end-handler.js';

describe('handleSessionEnd', () => {
  it('should create a session_end event with all required fields', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionEnd(hookInput);

    expect(event.event_type).toBe('session_end');
    expect(event.session_id).toBe('test-session-123');
    expect(event.cwd).toBe('/Users/test/project');
    expect(event.transcript_path).toBe('/Users/test/.claude/projects/test-session-123/transcript.jsonl');
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should include the same terminal information as session_start', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionEnd(hookInput);

    expect(event.terminal).toBeDefined();
    expect(event.terminal.tty).toBeDefined();
    expect(event.terminal.term).toBeDefined();
    expect(event.terminal.iterm).toBeDefined();
  });

  it('should include the same docker information as session_start', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionEnd(hookInput);

    expect(event.docker).toBeDefined();
    expect(typeof event.docker.is_container).toBe('boolean');
  });

  it('should include the same git information as session_start', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: process.cwd(),
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionEnd(hookInput);

    expect(event.git).toBeDefined();
    expect(typeof event.git.is_repo).toBe('boolean');
    expect(event.git.is_repo).toBe(true);
    expect(event.git.repo_name).toBe('agent-tracker');
  });

  it('should produce valid JSON when stringified', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionEnd(hookInput);
    const json = JSON.stringify(event);

    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.event_type).toBe('session_end');
    expect(parsed.session_id).toBe('test-session-123');
  });
});
