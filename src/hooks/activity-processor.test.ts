import { describe, it, expect } from 'vitest';
import { createActivityEventJson } from './activity-processor';

describe('activity-processor', () => {
  describe('createActivityEventJson', () => {
    it('should create tool_use activity event', () => {
      const input = {
        activity_type: 'tool_use',
        session_id: 'session-123',
        timestamp: '2025-10-20T12:00:00Z',
        tool_name: 'Read',
        hook_event_name: 'PostToolUse'
      };

      const result = createActivityEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        event_type: 'activity',
        activity_type: 'tool_use',
        session_id: 'session-123',
        timestamp: '2025-10-20T12:00:00Z',
        tool_name: 'Read',
        notification_message: 'unknown',
        hook_event_name: 'PostToolUse'
      });
    });

    it('should create prompt_submit activity event', () => {
      const input = {
        activity_type: 'prompt_submit',
        session_id: 'session-456',
        timestamp: '2025-10-20T12:01:00Z',
        hook_event_name: 'UserPromptSubmit'
      };

      const result = createActivityEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        event_type: 'activity',
        activity_type: 'prompt_submit',
        session_id: 'session-456',
        timestamp: '2025-10-20T12:01:00Z',
        tool_name: 'unknown',
        notification_message: 'unknown',
        hook_event_name: 'UserPromptSubmit'
      });
    });

    it('should create notification activity event', () => {
      const input = {
        activity_type: 'notification',
        session_id: 'session-789',
        timestamp: '2025-10-20T12:02:00Z',
        notification_message: 'Waiting for user input',
        hook_event_name: 'Notification'
      };

      const result = createActivityEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual({
        event_type: 'activity',
        activity_type: 'notification',
        session_id: 'session-789',
        timestamp: '2025-10-20T12:02:00Z',
        tool_name: 'unknown',
        notification_message: 'Waiting for user input',
        hook_event_name: 'Notification'
      });
    });

    it('should create stop activity event', () => {
      const input = {
        activity_type: 'stop',
        session_id: 'session-999',
        timestamp: '2025-10-20T12:03:00Z',
        hook_event_name: 'Stop'
      };

      const result = createActivityEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.event_type).toBe('activity');
      expect(parsed.activity_type).toBe('stop');
      expect(parsed.session_id).toBe('session-999');
    });

    it('should produce compact single-line JSON', () => {
      const input = {
        activity_type: 'tool_use',
        session_id: 'session-123',
        timestamp: '2025-10-20T12:00:00Z',
        tool_name: 'Read',
        hook_event_name: 'PostToolUse'
      };

      const result = createActivityEventJson(input);

      expect(result).not.toContain('\n');
      expect(result).not.toContain('  ');
    });

    it('should handle missing optional fields with defaults', () => {
      const input = {
        activity_type: 'tool_use',
        session_id: 'session-123',
        timestamp: '2025-10-20T12:00:00Z'
      };

      const result = createActivityEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.tool_name).toBe('unknown');
      expect(parsed.notification_message).toBe('unknown');
      expect(parsed.hook_event_name).toBe('unknown');
    });

    it('should always set event_type to "activity"', () => {
      const input = {
        activity_type: 'stop',
        session_id: 'session-123',
        timestamp: '2025-10-20T12:00:00Z'
      };

      const result = createActivityEventJson(input);
      const parsed = JSON.parse(result);

      expect(parsed.event_type).toBe('activity');
    });
  });
});
