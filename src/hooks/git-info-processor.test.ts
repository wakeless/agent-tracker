import { describe, it, expect } from 'vitest';
import { createGitInfoJson } from './git-info-processor';

describe('git-info-processor', () => {
  describe('createGitInfoJson', () => {
    it('should create JSON for git repository', () => {
      const input = {
        is_repo: 'true',
        branch: 'main',
        is_worktree: 'false',
        is_dirty: 'true',
        repo_name: 'my-project'
      };

      const result = createGitInfoJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        is_repo: true,
        branch: 'main',
        is_worktree: false,
        is_dirty: true,
        repo_name: 'my-project'
      });
    });

    it('should create JSON for non-git directory', () => {
      const input = {
        is_repo: 'false',
        branch: 'unknown',
        is_worktree: 'false',
        is_dirty: 'false',
        repo_name: 'unknown'
      };

      const result = createGitInfoJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        is_repo: false,
        branch: 'unknown',
        is_worktree: false,
        is_dirty: false,
        repo_name: 'unknown'
      });
    });

    it('should convert string booleans to actual booleans', () => {
      const input = {
        is_repo: 'true',
        branch: 'feature/test',
        is_worktree: 'true',
        is_dirty: 'false',
        repo_name: 'test-repo'
      };

      const result = createGitInfoJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.is_repo).toBe(true);
      expect(parsed.is_worktree).toBe(true);
      expect(parsed.is_dirty).toBe(false);
      expect(typeof parsed.is_repo).toBe('boolean');
      expect(typeof parsed.is_worktree).toBe('boolean');
      expect(typeof parsed.is_dirty).toBe('boolean');
    });

    it('should produce compact single-line JSON', () => {
      const input = {
        is_repo: 'true',
        branch: 'main',
        is_worktree: 'false',
        is_dirty: 'false',
        repo_name: 'my-project'
      };

      const result = createGitInfoJson(input);

      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should handle missing fields with defaults', () => {
      const input = {};

      const result = createGitInfoJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        is_repo: false,
        branch: 'unknown',
        is_worktree: false,
        is_dirty: false,
        repo_name: 'unknown'
      });
    });

    it('should handle partial data', () => {
      const input = {
        is_repo: 'true',
        branch: 'develop'
        // Missing other fields
      };

      const result = createGitInfoJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.is_repo).toBe(true);
      expect(parsed.branch).toBe('develop');
      expect(parsed.is_worktree).toBe(false);
      expect(parsed.is_dirty).toBe(false);
      expect(parsed.repo_name).toBe('unknown');
    });
  });
});
