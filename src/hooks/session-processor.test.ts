import { describe, it, expect } from 'vitest';
import { createSessionEventJson, parseHookInput } from './session-processor';

describe('session-processor', () => {
  describe('parseHookInput', () => {
    it('should parse JSON hook input', () => {
      const input = JSON.stringify({
        session_id: 'session-123',
        cwd: '/home/user/project',
        transcript_path: '/home/user/.claude/transcripts/session-123.jsonl'
      });

      const result = parseHookInput(input);

      expect(result).toEqual({
        session_id: 'session-123',
        cwd: '/home/user/project',
        transcript_path: '/home/user/.claude/transcripts/session-123.jsonl'
      });
    });

    it('should handle missing fields with defaults', () => {
      const input = '{}';

      const result = parseHookInput(input);

      expect(result.session_id).toBe('unknown');
      expect(result.cwd).toBe('unknown');
      expect(result.transcript_path).toBe('unknown');
    });

    it('should throw on invalid JSON', () => {
      const input = 'not-valid-json';

      expect(() => parseHookInput(input)).toThrow();
    });
  });

  describe('createSessionEventJson', () => {
    it('should create session_start event', () => {
      const input = {
        event_type: 'session_start',
        session_id: 'session-123',
        cwd: '/home/user/project',
        transcript_path: '/path/to/transcript.jsonl',
        terminal: {
          tty: '/dev/ttys001',
          term: 'xterm-256color',
          shell: '/bin/zsh',
          ppid: '12345',
          term_program: 'iTerm.app',
          term_session_id: 'w0t1p0:abc',
          lc_terminal: 'iTerm2',
          lc_terminal_version: '3.5.0',
          iterm: {
            session_id: 'w0t1p0:abc',
            profile: 'Default',
            tab_name: 'My Tab',
            window_name: 'My Window'
          }
        },
        docker: {
          is_container: false,
          container_id: 'unknown',
          container_name: 'unknown'
        },
        git: {
          is_repo: true,
          branch: 'main',
          is_worktree: false,
          is_dirty: true,
          repo_name: 'my-project'
        },
        timestamp: '2025-10-20T12:00:00Z'
      };

      const result = createSessionEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.event_type).toBe('session_start');
      expect(parsed.session_id).toBe('session-123');
      expect(parsed.cwd).toBe('/home/user/project');
      expect(parsed.terminal.tty).toBe('/dev/ttys001');
      expect(parsed.terminal.iterm.tab_name).toBe('My Tab');
      expect(parsed.git.is_repo).toBe(true);
      expect(parsed.git.branch).toBe('main');
      expect(parsed.docker.is_container).toBe(false);
    });

    it('should create session_end event', () => {
      const input = {
        event_type: 'session_end',
        session_id: 'session-123',
        cwd: '/home/user/project',
        transcript_path: '/path/to/transcript.jsonl',
        terminal: {
          tty: '/dev/ttys001',
          term: 'xterm-256color',
          shell: '/bin/zsh',
          ppid: '12345',
          term_program: 'iTerm.app',
          term_session_id: 'w0t1p0:abc',
          lc_terminal: 'iTerm2',
          lc_terminal_version: '3.5.0',
          iterm: {
            session_id: 'w0t1p0:abc',
            profile: 'Default',
            tab_name: 'My Tab',
            window_name: 'My Window'
          }
        },
        docker: {
          is_container: false,
          container_id: 'unknown',
          container_name: 'unknown'
        },
        git: {
          is_repo: false,
          branch: 'unknown',
          is_worktree: false,
          is_dirty: false,
          repo_name: 'unknown'
        },
        timestamp: '2025-10-20T12:10:00Z'
      };

      const result = createSessionEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.event_type).toBe('session_end');
      expect(parsed.session_id).toBe('session-123');
    });

    it('should produce compact single-line JSON', () => {
      const input = {
        event_type: 'session_start',
        session_id: 'session-123',
        cwd: '/home/user',
        transcript_path: '/path/to/transcript.jsonl',
        terminal: {
          tty: '/dev/ttys001',
          term: 'xterm',
          shell: '/bin/bash',
          ppid: '123',
          term_program: 'Terminal.app',
          term_session_id: 'test',
          lc_terminal: 'Terminal',
          lc_terminal_version: '1.0',
          iterm: {
            session_id: 'unknown',
            profile: 'unknown',
            tab_name: 'unknown',
            window_name: 'unknown'
          }
        },
        docker: {
          is_container: false,
          container_id: 'unknown',
          container_name: 'unknown'
        },
        git: {
          is_repo: false,
          branch: 'unknown',
          is_worktree: false,
          is_dirty: false,
          repo_name: 'unknown'
        },
        timestamp: '2025-10-20T12:00:00Z'
      };

      const result = createSessionEventJson(input);

      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should handle Docker container', () => {
      const input = {
        event_type: 'session_start',
        session_id: 'session-123',
        cwd: '/app',
        transcript_path: '/path/to/transcript.jsonl',
        terminal: {
          tty: '/dev/pts/0',
          term: 'xterm',
          shell: '/bin/bash',
          ppid: '1',
          term_program: 'unknown',
          term_session_id: 'unknown',
          lc_terminal: 'unknown',
          lc_terminal_version: 'unknown',
          iterm: {
            session_id: 'unknown',
            profile: 'unknown',
            tab_name: 'unknown',
            window_name: 'unknown'
          }
        },
        docker: {
          is_container: true,
          container_id: 'abc123def456',
          container_name: 'my-container'
        },
        git: {
          is_repo: true,
          branch: 'develop',
          is_worktree: false,
          is_dirty: false,
          repo_name: 'docker-project'
        },
        timestamp: '2025-10-20T12:00:00Z'
      };

      const result = createSessionEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.docker.is_container).toBe(true);
      expect(parsed.docker.container_id).toBe('abc123def456');
      expect(parsed.docker.container_name).toBe('my-container');
    });

    it('should preserve all nested structure', () => {
      const input = {
        event_type: 'session_start',
        session_id: 'session-123',
        cwd: '/home/user',
        transcript_path: '/path/to/transcript.jsonl',
        terminal: {
          tty: '/dev/ttys001',
          term: 'xterm',
          shell: '/bin/zsh',
          ppid: '123',
          term_program: 'iTerm.app',
          term_session_id: 'w0t1p0:abc',
          lc_terminal: 'iTerm2',
          lc_terminal_version: '3.5.0',
          iterm: {
            session_id: 'w0t1p0:abc',
            profile: 'Default',
            tab_name: 'My Tab',
            window_name: 'My Window'
          }
        },
        docker: {
          is_container: false,
          container_id: 'unknown',
          container_name: 'unknown'
        },
        git: {
          is_repo: true,
          branch: 'feature/test',
          is_worktree: true,
          is_dirty: true,
          repo_name: 'test-project'
        },
        timestamp: '2025-10-20T12:00:00Z'
      };

      const result = createSessionEventJson(input);
      const parsed = JSON.parse(result);

      // Verify structure is preserved
      expect(parsed).toHaveProperty('terminal.iterm.session_id');
      expect(parsed).toHaveProperty('docker.is_container');
      expect(parsed).toHaveProperty('git.is_repo');
      expect(parsed.terminal.iterm).toBeDefined();
      expect(parsed.docker).toBeDefined();
      expect(parsed.git).toBeDefined();
    });
  });
});
