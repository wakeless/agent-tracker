/**
 * Tests for Activity Handler
 */

import { describe, it, expect } from 'vitest';
import { handleActivity } from './activity-handler.js';

describe('handleActivity', () => {
  it('should create tool_use activity event', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.event_type).toBe('activity');
    expect(event?.activity_type).toBe('tool_use');
    expect(event?.session_id).toBe('test-session-123');
    expect(event?.tool_name).toBe('Bash');
    expect(event?.hook_event_name).toBe('PostToolUse');
    expect(event?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should create prompt_submit activity event', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'UserPromptSubmit'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.activity_type).toBe('prompt_submit');
    expect(event?.session_id).toBe('test-session-123');
    expect(event?.hook_event_name).toBe('UserPromptSubmit');
  });

  it('should create stop activity event', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'Stop'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.activity_type).toBe('stop');
    expect(event?.session_id).toBe('test-session-123');
    expect(event?.hook_event_name).toBe('Stop');
  });

  it('should create subagent_stop activity event', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'SubagentStop'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.activity_type).toBe('subagent_stop');
    expect(event?.session_id).toBe('test-session-123');
    expect(event?.hook_event_name).toBe('SubagentStop');
  });

  it('should create notification activity event with message', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'Notification',
      message: 'Claude is waiting for your input'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.activity_type).toBe('notification');
    expect(event?.session_id).toBe('test-session-123');
    expect(event?.notification_message).toBe('Claude is waiting for your input');
    expect(event?.hook_event_name).toBe('Notification');
  });

  it('should return null for unknown hook event', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'UnknownEvent'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeNull();
  });

  it('should handle missing session_id with default', () => {
    const hookInput = {
      hook_event_name: 'Stop'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.session_id).toBe('unknown');
  });

  it('should not include tool_name for non-tool events', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'Stop',
      tool_name: 'ShouldNotAppear'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.tool_name).toBeUndefined();
  });

  it('should not include notification_message for non-notification events', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'Stop',
      message: 'ShouldNotAppear'
    };

    const event = handleActivity(hookInput);

    expect(event).toBeDefined();
    expect(event?.notification_message).toBeUndefined();
  });

  it('should produce valid JSON when stringified', () => {
    const hookInput = {
      session_id: 'test-session-123',
      hook_event_name: 'PostToolUse',
      tool_name: 'Bash'
    };

    const event = handleActivity(hookInput);
    expect(event).toBeDefined();

    const json = JSON.stringify(event);
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.event_type).toBe('activity');
    expect(parsed.activity_type).toBe('tool_use');
  });
});
