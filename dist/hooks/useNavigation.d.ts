import { ParsedTranscriptEntry } from '../types/transcript.js';
/**
 * Navigation Stack Items
 *
 * Each stack item represents a view in the navigation hierarchy:
 * - list: Session list view (depth 0)
 * - transcript: Transcript viewer for a session (depth 1)
 * - tool-detail: Tool use/result detail view (depth 2)
 */
export type NavStackItem = {
    type: 'list';
    selectedSessionId: string | null;
} | {
    type: 'transcript';
    sessionId: string;
    selectedUuid?: string;
} | {
    type: 'tool-detail';
    sessionId: string;
    toolEntryUuid: string;
    allTranscriptEntries: ParsedTranscriptEntry[];
};
/**
 * Navigation State
 */
export interface NavState {
    stack: NavStackItem[];
}
/**
 * Navigation Actions
 */
export type NavAction = {
    type: 'INIT';
    sessionId: string | null;
} | {
    type: 'PUSH_TRANSCRIPT';
    sessionId: string;
} | {
    type: 'PUSH_TOOL_DETAIL';
    sessionId: string;
    toolEntryUuid: string;
    allTranscriptEntries: ParsedTranscriptEntry[];
} | {
    type: 'POP';
} | {
    type: 'UPDATE_SESSION_SELECTION';
    sessionId: string | null;
} | {
    type: 'UPDATE_TRANSCRIPT_POSITION';
    selectedUuid: string;
};
/**
 * Navigation Reducer
 *
 * Pure function that handles all navigation state transitions.
 */
export declare function navigationReducer(state: NavState, action: NavAction): NavState;
/**
 * Navigation Hook
 *
 * Provides a clean API for managing navigation stack state.
 *
 * @param initialSessionId - The session ID to select on initial load
 * @returns Navigation state and helper functions
 */
export declare function useNavigation(initialSessionId: string | null): {
    currentView: NavStackItem;
    depth: number;
    stack: NavStackItem[];
    dispatch: import("react").ActionDispatch<[action: NavAction]>;
    selectSession: (sessionId: string | null) => void;
    pushTranscript: (sessionId: string) => void;
    pushToolDetail: (sessionId: string, toolEntryUuid: string, allEntries: ParsedTranscriptEntry[]) => void;
    pop: () => void;
    updateTranscriptPosition: (selectedUuid: string) => void;
};
/**
 * Type guard to check if current view is list view
 */
export declare function isListView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'list';
}>;
/**
 * Type guard to check if current view is transcript view
 */
export declare function isTranscriptView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'transcript';
}>;
/**
 * Type guard to check if current view is tool detail view
 */
export declare function isToolDetailView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'tool-detail';
}>;
//# sourceMappingURL=useNavigation.d.ts.map