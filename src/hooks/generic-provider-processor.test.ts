import { describe, it, expect } from 'vitest';
import { createGenericProviderJson } from './generic-provider-processor';

describe('generic-provider-processor', () => {
  describe('createGenericProviderJson', () => {
    it('should create JSON with provided session_id', () => {
      const input = {
        session_id: 'w0t1p0:12345678'
      };

      const result = createGenericProviderJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        session_id: 'w0t1p0:12345678',
        profile: 'unknown',
        tab_name: 'unknown',
        window_name: 'unknown'
      });
    });

    it('should use "unknown" for missing session_id', () => {
      const input = {};

      const result = createGenericProviderJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        session_id: 'unknown',
        profile: 'unknown',
        tab_name: 'unknown',
        window_name: 'unknown'
      });
    });

    it('should produce compact single-line JSON', () => {
      const input = {
        session_id: 'test-session'
      };

      const result = createGenericProviderJson(input);

      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should always set profile, tab_name, and window_name to unknown', () => {
      const input = {
        session_id: 'test-session',
        // These should be ignored in generic provider
        profile: 'ShouldBeIgnored',
        tab_name: 'ShouldBeIgnored',
        window_name: 'ShouldBeIgnored'
      };

      const result = createGenericProviderJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.profile).toBe('unknown');
      expect(parsed.tab_name).toBe('unknown');
      expect(parsed.window_name).toBe('unknown');
    });

    it('should handle empty string session_id', () => {
      const input = {
        session_id: ''
      };

      const result = createGenericProviderJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.session_id).toBe('');
    });
  });
});
