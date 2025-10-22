// Action types for Redux-style ActivityStore
// These represent all events that can modify activity state
/**
 * Action Creators
 */
export const actions = {
    sessionStart: (event) => ({
        type: 'SESSION_START',
        payload: event,
    }),
    sessionEnd: (event) => ({
        type: 'SESSION_END',
        payload: event,
    }),
    activityToolUse: (event) => ({
        type: 'ACTIVITY_TOOL_USE',
        payload: event,
    }),
    activityPromptSubmit: (event) => ({
        type: 'ACTIVITY_PROMPT_SUBMIT',
        payload: event,
    }),
    activityStop: (event) => ({
        type: 'ACTIVITY_STOP',
        payload: event,
    }),
    activitySubagentStop: (event) => ({
        type: 'ACTIVITY_SUBAGENT_STOP',
        payload: event,
    }),
    activityNotification: (event) => ({
        type: 'ACTIVITY_NOTIFICATION',
        payload: event,
    }),
    updateSessionStatuses: (currentTime, inactiveThresholdMs, removeEndedSessionsMs) => ({
        type: 'UPDATE_SESSION_STATUSES',
        payload: { currentTime, inactiveThresholdMs, removeEndedSessionsMs },
    }),
    updateWorkSummary: (sessionId, summary) => ({
        type: 'UPDATE_WORK_SUMMARY',
        payload: { sessionId, summary },
    }),
};
//# sourceMappingURL=actions.js.map