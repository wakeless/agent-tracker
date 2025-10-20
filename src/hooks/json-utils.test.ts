import { describe, it, expect } from 'vitest';
import { parseJsonInput, createJsonOutput, extractField } from './json-utils';

describe('json-utils', () => {
  describe('parseJsonInput', () => {
    it('should parse valid JSON string', () => {
      const input = '{"session_id": "test-123", "cwd": "/home/user"}';
      const result = parseJsonInput(input);

      expect(result).toEqual({
        session_id: 'test-123',
        cwd: '/home/user'
      });
    });

    it('should throw error for invalid JSON', () => {
      const input = 'not-valid-json';

      expect(() => parseJsonInput(input)).toThrow();
    });

    it('should handle empty string', () => {
      const input = '';

      expect(() => parseJsonInput(input)).toThrow();
    });

    it('should parse JSON with nested objects', () => {
      const input = '{"terminal": {"tty": "/dev/tty", "term": "xterm"}}';
      const result = parseJsonInput(input);

      expect(result).toEqual({
        terminal: {
          tty: '/dev/tty',
          term: 'xterm'
        }
      });
    });
  });

  describe('createJsonOutput', () => {
    it('should create compact single-line JSON', () => {
      const data = {
        event_type: 'session_start',
        session_id: 'test-123'
      };

      const result = createJsonOutput(data);

      expect(result).toBe('{"event_type":"session_start","session_id":"test-123"}');
      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should handle nested objects', () => {
      const data = {
        terminal: {
          tty: '/dev/tty',
          term: 'xterm'
        }
      };

      const result = createJsonOutput(data);

      expect(result).toBe('{"terminal":{"tty":"/dev/tty","term":"xterm"}}');
    });

    it('should handle arrays', () => {
      const data = {
        items: ['a', 'b', 'c']
      };

      const result = createJsonOutput(data);

      expect(result).toBe('{"items":["a","b","c"]}');
    });

    it('should handle boolean values', () => {
      const data = {
        is_repo: true,
        is_dirty: false
      };

      const result = createJsonOutput(data);

      expect(result).toBe('{"is_repo":true,"is_dirty":false}');
    });
  });

  describe('extractField', () => {
    it('should extract simple field', () => {
      const data = { session_id: 'test-123' };
      const result = extractField(data, 'session_id', 'unknown');

      expect(result).toBe('test-123');
    });

    it('should return default for missing field', () => {
      const data = { session_id: 'test-123' };
      const result = extractField(data, 'cwd', 'unknown');

      expect(result).toBe('unknown');
    });

    it('should extract nested field with dot notation', () => {
      const data = {
        terminal: {
          iterm: {
            tab_name: 'My Tab'
          }
        }
      };

      const result = extractField(data, 'terminal.iterm.tab_name', 'unknown');

      expect(result).toBe('My Tab');
    });

    it('should return default for missing nested field', () => {
      const data = {
        terminal: {
          tty: '/dev/tty'
        }
      };

      const result = extractField(data, 'terminal.iterm.tab_name', 'unknown');

      expect(result).toBe('unknown');
    });

    it('should handle null values', () => {
      const data = { session_id: null };
      const result = extractField(data, 'session_id', 'unknown');

      expect(result).toBe('unknown');
    });

    it('should handle undefined values', () => {
      const data = { session_id: undefined };
      const result = extractField(data, 'session_id', 'unknown');

      expect(result).toBe('unknown');
    });

    it('should preserve empty string values', () => {
      const data = { session_id: '' };
      const result = extractField(data, 'session_id', 'unknown');

      expect(result).toBe('');
    });

    it('should handle numeric values', () => {
      const data = { count: 42 };
      const result = extractField(data, 'count', 0);

      expect(result).toBe(42);
    });

    it('should handle boolean values', () => {
      const data = { is_repo: true };
      const result = extractField(data, 'is_repo', false);

      expect(result).toBe(true);
    });
  });
});
