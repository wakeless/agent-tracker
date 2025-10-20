import { SessionStartEvent, SessionEndEvent } from './events.js';
/**
 * Activity event from Claude Code hooks
 */
export interface ActivityEvent {
    event_type: 'activity';
    activity_type: 'tool_use' | 'prompt_submit' | 'stop' | 'subagent_stop' | 'notification';
    session_id: string;
    timestamp: string;
    tool_name?: string;
    notification_message?: string;
    hook_event_name?: string;
}
/**
 * Action Types
 */
export type ActionType = 'SESSION_START' | 'SESSION_END' | 'ACTIVITY_TOOL_USE' | 'ACTIVITY_PROMPT_SUBMIT' | 'ACTIVITY_STOP' | 'ACTIVITY_SUBAGENT_STOP' | 'ACTIVITY_NOTIFICATION' | 'UPDATE_SESSION_STATUSES';
/**
 * Action Interfaces
 */
export interface SessionStartAction {
    type: 'SESSION_START';
    payload: SessionStartEvent;
}
export interface SessionEndAction {
    type: 'SESSION_END';
    payload: SessionEndEvent;
}
export interface ActivityToolUseAction {
    type: 'ACTIVITY_TOOL_USE';
    payload: ActivityEvent;
}
export interface ActivityPromptSubmitAction {
    type: 'ACTIVITY_PROMPT_SUBMIT';
    payload: ActivityEvent;
}
export interface ActivityStopAction {
    type: 'ACTIVITY_STOP';
    payload: ActivityEvent;
}
export interface ActivitySubagentStopAction {
    type: 'ACTIVITY_SUBAGENT_STOP';
    payload: ActivityEvent;
}
export interface ActivityNotificationAction {
    type: 'ACTIVITY_NOTIFICATION';
    payload: ActivityEvent;
}
export interface UpdateSessionStatusesAction {
    type: 'UPDATE_SESSION_STATUSES';
    payload: {
        currentTime: number;
        inactiveThresholdMs: number;
        removeEndedSessionsMs: number;
    };
}
/**
 * Discriminated Union of All Actions
 */
export type Action = SessionStartAction | SessionEndAction | ActivityToolUseAction | ActivityPromptSubmitAction | ActivityStopAction | ActivitySubagentStopAction | ActivityNotificationAction | UpdateSessionStatusesAction;
/**
 * Action Creators
 */
export declare const actions: {
    sessionStart: (event: SessionStartEvent) => SessionStartAction;
    sessionEnd: (event: SessionEndEvent) => SessionEndAction;
    activityToolUse: (event: ActivityEvent) => ActivityToolUseAction;
    activityPromptSubmit: (event: ActivityEvent) => ActivityPromptSubmitAction;
    activityStop: (event: ActivityEvent) => ActivityStopAction;
    activitySubagentStop: (event: ActivityEvent) => ActivitySubagentStopAction;
    activityNotification: (event: ActivityEvent) => ActivityNotificationAction;
    updateSessionStatuses: (currentTime: number, inactiveThresholdMs: number, removeEndedSessionsMs: number) => UpdateSessionStatusesAction;
};
//# sourceMappingURL=actions.d.ts.map