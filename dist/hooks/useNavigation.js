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
        pop,
        updateTranscriptPosition,
    }), [currentView, depth, state.stack, dispatch, selectSession, pushTranscript, pushToolDetail, pop, updateTranscriptPosition]);
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
//# sourceMappingURL=useNavigation.js.map