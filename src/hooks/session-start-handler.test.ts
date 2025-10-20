/**
 * Tests for Session Start Handler
 */

import { describe, it, expect } from 'vitest';
import { handleSessionStart } from './session-start-handler.js';

describe('handleSessionStart', () => {
  it('should create a session_start event with all required fields', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);

    expect(event.event_type).toBe('session_start');
    expect(event.session_id).toBe('test-session-123');
    expect(event.cwd).toBe('/Users/test/project');
    expect(event.transcript_path).toBe('/Users/test/.claude/projects/test-session-123/transcript.jsonl');
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should include terminal information', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);

    expect(event.terminal).toBeDefined();
    expect(event.terminal.tty).toBeDefined();
    expect(event.terminal.term).toBeDefined();
    expect(event.terminal.shell).toBeDefined();
    expect(event.terminal.ppid).toBeDefined();
    expect(event.terminal.term_program).toBeDefined();
    expect(event.terminal.iterm).toBeDefined();
    expect(event.terminal.iterm.session_id).toBeDefined();
    expect(event.terminal.iterm.profile).toBeDefined();
    expect(event.terminal.iterm.tab_name).toBeDefined();
    expect(event.terminal.iterm.window_name).toBeDefined();
  });

  it('should include docker information', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);

    expect(event.docker).toBeDefined();
    expect(typeof event.docker.is_container).toBe('boolean');
    expect(event.docker.container_id).toBeDefined();
    expect(event.docker.container_name).toBeDefined();
  });

  it('should include git information for current directory', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: process.cwd(), // Use current directory which is a git repo
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);

    expect(event.git).toBeDefined();
    expect(typeof event.git.is_repo).toBe('boolean');
    expect(event.git.branch).toBeDefined();
    expect(typeof event.git.is_worktree).toBe('boolean');
    expect(typeof event.git.is_dirty).toBe('boolean');
    expect(event.git.repo_name).toBeDefined();

    // Current directory is a git repo
    expect(event.git.is_repo).toBe(true);
    expect(event.git.repo_name).toBe('agent-tracker');
  });

  it('should handle missing optional fields with defaults', () => {
    const hookInput = {
      session_id: undefined as any,
      cwd: undefined as any,
      transcript_path: undefined as any
    };

    const event = handleSessionStart(hookInput);

    expect(event.session_id).toBe('unknown');
    expect(event.cwd).toBe('unknown');
    expect(event.transcript_path).toBe('unknown');
  });

  it('should handle non-git directory gracefully', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/tmp', // Not a git repo
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);

    expect(event.git.is_repo).toBe(false);
    expect(event.git.branch).toBe('unknown');
    expect(event.git.is_worktree).toBe(false);
    expect(event.git.is_dirty).toBe(false);
    expect(event.git.repo_name).toBe('unknown');
  });

  it('should handle invalid cwd gracefully', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/nonexistent/directory/that/does/not/exist',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);

    // Should not crash, should return default git info
    expect(event.git.is_repo).toBe(false);
    expect(event.git.branch).toBe('unknown');
  });

  it('should produce valid JSON when stringified', () => {
    const hookInput = {
      session_id: 'test-session-123',
      cwd: '/Users/test/project',
      transcript_path: '/Users/test/.claude/projects/test-session-123/transcript.jsonl'
    };

    const event = handleSessionStart(hookInput);
    const json = JSON.stringify(event);

    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.event_type).toBe('session_start');
    expect(parsed.session_id).toBe('test-session-123');
  });
});
