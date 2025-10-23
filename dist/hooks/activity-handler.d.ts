#!/usr/bin/env node
/**
 * Activity Handler
 * Complete TypeScript implementation of activity hook logic
 * Replaces activity.sh bash script
 * Used by: PostToolUse, UserPromptSubmit, Stop, SubagentStop, Notification
 */
interface HookInput {
    session_id: string;
    hook_event_name: string;
    tool_name?: string;
    message?: string;
    tool_input?: Record<string, unknown>;
    [key: string]: unknown;
}
interface ProcessInfo {
    pid: string;
    ppid: string;
}
interface ActivityEvent {
    event_type: 'activity';
    activity_type: string;
    session_id: string;
    timestamp: string;
    tool_name?: string;
    tool_input?: Record<string, unknown>;
    notification_message?: string;
    hook_event_name: string;
    process?: ProcessInfo;
}
/**
 * Process activity event
 */
export declare function handleActivity(hookInput: HookInput): ActivityEvent | null;
export {};
//# sourceMappingURL=activity-handler.d.ts.map