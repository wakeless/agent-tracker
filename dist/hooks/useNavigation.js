import { useReducer, useCallback, useMemo } from 'react';
/**
 * Navigation Reducer
 *
 * Pure function that handles all navigation state transitions.
 */
export function navigationReducer(state, action) {
    switch (action.type) {
        case 'INIT':
            return {
                stack: [{ type: 'list', selectedSessionId: action.sessionId }],
            };
        case 'PUSH_TRANSCRIPT':
            return {
                stack: [...state.stack, { type: 'transcript', sessionId: action.sessionId }],
            };
        case 'PUSH_TOOL_DETAIL':
            return {
                stack: [
                    ...state.stack,
                    {
                        type: 'tool-detail',
                        sessionId: action.sessionId,
                        toolEntryUuid: action.toolEntryUuid,
                        allTranscriptEntries: action.allTranscriptEntries,
                    },
                ],
            };
        case 'PUSH_PLAN_DETAIL':
            return {
                stack: [
                    ...state.stack,
                    {
                        type: 'plan-detail',
                        sessionId: action.sessionId,
                        planEntryUuid: action.planEntryUuid,
                        plan: action.plan,
                        allowedPrompts: action.allowedPrompts,
                    },
                ],
            };
        case 'PUSH_EDIT_DETAIL':
            return {
                stack: [
                    ...state.stack,
                    {
                        type: 'edit-detail',
                        sessionId: action.sessionId,
                        editEntryUuid: action.editEntryUuid,
                        editInput: action.editInput,
                    },
                ],
            };
        case 'PUSH_WRITE_DETAIL':
            return {
                stack: [
                    ...state.stack,
                    {
                        type: 'write-detail',
                        sessionId: action.sessionId,
                        writeEntryUuid: action.writeEntryUuid,
                        writeInput: action.writeInput,
                    },
                ],
            };
        case 'PUSH_BASH_DETAIL':
            return {
                stack: [
                    ...state.stack,
                    {
                        type: 'bash-detail',
                        sessionId: action.sessionId,
                        bashEntryUuid: action.bashEntryUuid,
                        bashInput: action.bashInput,
                        toolResult: action.toolResult,
                    },
                ],
            };
        case 'PUSH_GREP_DETAIL':
            return {
                stack: [
                    ...state.stack,
                    {
                        type: 'grep-detail',
                        sessionId: action.sessionId,
                        grepEntryUuid: action.grepEntryUuid,
                        grepInput: action.grepInput,
                        toolResult: action.toolResult,
                    },
                ],
            };
        case 'POP':
            // Never pop the last item (list view is always at bottom)
            if (state.stack.length <= 1) {
                return state;
            }
            return {
                stack: state.stack.slice(0, -1),
            };
        case 'UPDATE_SESSION_SELECTION': {
            // Only update if top of stack is list view
            const top = state.stack[state.stack.length - 1];
            if (top.type !== 'list') {
                return state;
            }
            return {
                stack: [...state.stack.slice(0, -1), { type: 'list', selectedSessionId: action.sessionId }],
            };
        }
        case 'UPDATE_TRANSCRIPT_POSITION': {
            // Only update if top of stack is transcript view
            const top = state.stack[state.stack.length - 1];
            if (top.type !== 'transcript') {
                return state;
            }
            return {
                stack: [
                    ...state.stack.slice(0, -1),
                    { ...top, selectedUuid: action.selectedUuid },
                ],
            };
        }
        default:
            return state;
    }
}
/**
 * Navigation Hook
 *
 * Provides a clean API for managing navigation stack state.
 *
 * @param initialSessionId - The session ID to select on initial load
 * @returns Navigation state and helper functions
 */
export function useNavigation(initialSessionId) {
    const [state, dispatch] = useReducer(navigationReducer, {
        stack: [{ type: 'list', selectedSessionId: initialSessionId }],
    });
    const currentView = state.stack[state.stack.length - 1];
    const depth = state.stack.length;
    // Memoize navigation methods to prevent unnecessary re-renders
    const selectSession = useCallback((sessionId) => dispatch({ type: 'UPDATE_SESSION_SELECTION', sessionId }), []);
    const pushTranscript = useCallback((sessionId) => dispatch({ type: 'PUSH_TRANSCRIPT', sessionId }), []);
    const pushToolDetail = useCallback((sessionId, toolEntryUuid, allEntries) => dispatch({
        type: 'PUSH_TOOL_DETAIL',
        sessionId,
        toolEntryUuid,
        allTranscriptEntries: allEntries,
    }), []);
    const pushPlanDetail = useCallback((sessionId, planEntryUuid, plan, allowedPrompts) => dispatch({
        type: 'PUSH_PLAN_DETAIL',
        sessionId,
        planEntryUuid,
        plan,
        allowedPrompts,
    }), []);
    const pushEditDetail = useCallback((sessionId, editEntryUuid, editInput) => dispatch({
        type: 'PUSH_EDIT_DETAIL',
        sessionId,
        editEntryUuid,
        editInput,
    }), []);
    const pushWriteDetail = useCallback((sessionId, writeEntryUuid, writeInput) => dispatch({
        type: 'PUSH_WRITE_DETAIL',
        sessionId,
        writeEntryUuid,
        writeInput,
    }), []);
    const pushBashDetail = useCallback((sessionId, bashEntryUuid, bashInput, toolResult) => dispatch({
        type: 'PUSH_BASH_DETAIL',
        sessionId,
        bashEntryUuid,
        bashInput,
        toolResult,
    }), []);
    const pushGrepDetail = useCallback((sessionId, grepEntryUuid, grepInput, toolResult) => dispatch({
        type: 'PUSH_GREP_DETAIL',
        sessionId,
        grepEntryUuid,
        grepInput,
        toolResult,
    }), []);
    const pop = useCallback(() => dispatch({ type: 'POP' }), []);
    const updateTranscriptPosition = useCallback((selectedUuid) => dispatch({ type: 'UPDATE_TRANSCRIPT_POSITION', selectedUuid }), []);
    // Return a stable object reference using useMemo
    return useMemo(() => ({
        // State
        currentView,
        depth,
        stack: state.stack,
        dispatch,
        // Convenience methods (now stable)
        selectSession,
        pushTranscript,
        pushToolDetail,
        pushPlanDetail,
        pushEditDetail,
        pushWriteDetail,
        pushBashDetail,
        pushGrepDetail,
        pop,
        updateTranscriptPosition,
    }), [currentView, depth, state.stack, dispatch, selectSession, pushTranscript, pushToolDetail, pushPlanDetail, pushEditDetail, pushWriteDetail, pushBashDetail, pushGrepDetail, pop, updateTranscriptPosition]);
}
/**
 * Type guard to check if current view is list view
 */
export function isListView(view) {
    return view.type === 'list';
}
/**
 * Type guard to check if current view is transcript view
 */
export function isTranscriptView(view) {
    return view.type === 'transcript';
}
/**
 * Type guard to check if current view is tool detail view
 */
export function isToolDetailView(view) {
    return view.type === 'tool-detail';
}
/**
 * Type guard to check if current view is plan detail view
 */
export function isPlanDetailView(view) {
    return view.type === 'plan-detail';
}
/**
 * Type guard to check if current view is edit detail view
 */
export function isEditDetailView(view) {
    return view.type === 'edit-detail';
}
/**
 * Type guard to check if current view is write detail view
 */
export function isWriteDetailView(view) {
    return view.type === 'write-detail';
}
/**
 * Type guard to check if current view is bash detail view
 */
export function isBashDetailView(view) {
    return view.type === 'bash-detail';
}
/**
 * Type guard to check if current view is grep detail view
 */
export function isGrepDetailView(view) {
    return view.type === 'grep-detail';
}
//# sourceMappingURL=useNavigation.js.map