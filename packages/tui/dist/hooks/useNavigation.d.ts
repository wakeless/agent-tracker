import { ParsedTranscriptEntry } from '@agent-tracker/core';
import { EditInput, WriteInput, BashInput, GrepInput } from '../components/tools/ToolDisplayProps.js';
/**
 * Navigation Stack Items
 *
 * Each stack item represents a view in the navigation hierarchy:
 * - list: Session list view (depth 0)
 * - transcript: Transcript viewer for a session (depth 1)
 * - tool-detail: Tool use/result detail view (depth 2)
 * - edit-detail: Edit tool detail view (depth 2)
 * - write-detail: Write tool detail view (depth 2)
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
} | {
    type: 'plan-detail';
    sessionId: string;
    planEntryUuid: string;
    plan: string;
    allowedPrompts?: Array<{
        tool: string;
        prompt: string;
    }>;
} | {
    type: 'edit-detail';
    sessionId: string;
    editEntryUuid: string;
    editInput: EditInput;
} | {
    type: 'write-detail';
    sessionId: string;
    writeEntryUuid: string;
    writeInput: WriteInput;
} | {
    type: 'bash-detail';
    sessionId: string;
    bashEntryUuid: string;
    bashInput: BashInput;
    toolResult: ParsedTranscriptEntry | null;
} | {
    type: 'grep-detail';
    sessionId: string;
    grepEntryUuid: string;
    grepInput: GrepInput;
    toolResult: ParsedTranscriptEntry | null;
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
    type: 'PUSH_PLAN_DETAIL';
    sessionId: string;
    planEntryUuid: string;
    plan: string;
    allowedPrompts?: Array<{
        tool: string;
        prompt: string;
    }>;
} | {
    type: 'PUSH_EDIT_DETAIL';
    sessionId: string;
    editEntryUuid: string;
    editInput: EditInput;
} | {
    type: 'PUSH_WRITE_DETAIL';
    sessionId: string;
    writeEntryUuid: string;
    writeInput: WriteInput;
} | {
    type: 'PUSH_BASH_DETAIL';
    sessionId: string;
    bashEntryUuid: string;
    bashInput: BashInput;
    toolResult: ParsedTranscriptEntry | null;
} | {
    type: 'PUSH_GREP_DETAIL';
    sessionId: string;
    grepEntryUuid: string;
    grepInput: GrepInput;
    toolResult: ParsedTranscriptEntry | null;
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
    pushPlanDetail: (sessionId: string, planEntryUuid: string, plan: string, allowedPrompts?: Array<{
        tool: string;
        prompt: string;
    }>) => void;
    pushEditDetail: (sessionId: string, editEntryUuid: string, editInput: EditInput) => void;
    pushWriteDetail: (sessionId: string, writeEntryUuid: string, writeInput: WriteInput) => void;
    pushBashDetail: (sessionId: string, bashEntryUuid: string, bashInput: BashInput, toolResult: ParsedTranscriptEntry | null) => void;
    pushGrepDetail: (sessionId: string, grepEntryUuid: string, grepInput: GrepInput, toolResult: ParsedTranscriptEntry | null) => void;
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
/**
 * Type guard to check if current view is plan detail view
 */
export declare function isPlanDetailView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'plan-detail';
}>;
/**
 * Type guard to check if current view is edit detail view
 */
export declare function isEditDetailView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'edit-detail';
}>;
/**
 * Type guard to check if current view is write detail view
 */
export declare function isWriteDetailView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'write-detail';
}>;
/**
 * Type guard to check if current view is bash detail view
 */
export declare function isBashDetailView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'bash-detail';
}>;
/**
 * Type guard to check if current view is grep detail view
 */
export declare function isGrepDetailView(view: NavStackItem): view is Extract<NavStackItem, {
    type: 'grep-detail';
}>;
//# sourceMappingURL=useNavigation.d.ts.map