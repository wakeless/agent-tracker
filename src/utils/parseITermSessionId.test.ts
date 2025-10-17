import { describe, it, expect } from 'vitest';
import { parseITermSessionId } from './parseITermSessionId.js';

describe('parseITermSessionId', () => {
  describe('valid iTerm session IDs', () => {
    it('should parse standard iTerm session ID', () => {
      const result = parseITermSessionId('w0t4p2:abc-123');

      expect(result).toEqual({
        window: 0,
        tab: 4,
        pane: 2,
        uuid: 'abc-123',
        isValid: true,
      });
    });

    it('should parse session ID with different window/tab/pane numbers', () => {
      const result = parseITermSessionId('w1t0p0:xyz-789');

      expect(result).toEqual({
        window: 1,
        tab: 0,
        pane: 0,
        uuid: 'xyz-789',
        isValid: true,
      });
    });

    it('should parse session ID with large numbers', () => {
      const result = parseITermSessionId('w99t99p99:test-uuid');

      expect(result).toEqual({
        window: 99,
        tab: 99,
        pane: 99,
        uuid: 'test-uuid',
        isValid: true,
      });
    });

    it('should parse session ID with complex UUID', () => {
      const result = parseITermSessionId('w0t1p0:550e8400-e29b-41d4-a716-446655440000');

      expect(result).toEqual({
        window: 0,
        tab: 1,
        pane: 0,
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        isValid: true,
      });
    });
  });

  describe('invalid session IDs', () => {
    it('should return invalid for "unknown"', () => {
      const result = parseITermSessionId('unknown');

      expect(result.isValid).toBe(false);
      expect(result).toEqual({
        window: 0,
        tab: 0,
        pane: 0,
        uuid: '',
        isValid: false,
      });
    });

    it('should return invalid for empty string', () => {
      const result = parseITermSessionId('');

      expect(result.isValid).toBe(false);
      expect(result).toEqual({
        window: 0,
        tab: 0,
        pane: 0,
        uuid: '',
        isValid: false,
      });
    });

    it('should return invalid for malformed format (missing pane)', () => {
      const result = parseITermSessionId('w0t4:abc-123');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for malformed format (missing UUID separator)', () => {
      const result = parseITermSessionId('w0t4p2');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for partial match', () => {
      const result = parseITermSessionId('t4p2:abc-123');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for format with non-numeric values', () => {
      const result = parseITermSessionId('wabtcp2:abc-123');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for whitespace-only string', () => {
      const result = parseITermSessionId('   ');

      expect(result.isValid).toBe(false);
    });

    it('should return invalid for generic terminal session ID', () => {
      const result = parseITermSessionId('terminal-session-123');

      expect(result.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should return invalid for session ID with empty UUID after colon', () => {
      const result = parseITermSessionId('w0t0p0:');

      expect(result).toEqual({
        window: 0,
        tab: 0,
        pane: 0,
        uuid: '',
        isValid: false,
      });
    });

    it('should parse session ID with UUID containing special characters', () => {
      const result = parseITermSessionId('w2t3p1:abc_123-xyz.test');

      expect(result).toEqual({
        window: 2,
        tab: 3,
        pane: 1,
        uuid: 'abc_123-xyz.test',
        isValid: true,
      });
    });
  });
});
