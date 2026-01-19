import { useReducer, useCallback, useMemo } from 'react';
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
export type NavStackItem =
  | {
      type: 'list';
      selectedSessionId: string | null;
    }
  | {
      type: 'transcript';
      sessionId: string;
      selectedUuid?: string; // Store scroll position in transcript
    }
  | {
      type: 'tool-detail';
      sessionId: string;
      toolEntryUuid: string;
      allTranscriptEntries: ParsedTranscriptEntry[];
    }
  | {
      type: 'plan-detail';
      sessionId: string;
      planEntryUuid: string;
      plan: string;
      allowedPrompts?: Array<{ tool: string; prompt: string }>;
    }
  | {
      type: 'edit-detail';
      sessionId: string;
      editEntryUuid: string;
      editInput: EditInput;
    }
  | {
      type: 'write-detail';
      sessionId: string;
      writeEntryUuid: string;
      writeInput: WriteInput;
    }
  | {
      type: 'bash-detail';
      sessionId: string;
      bashEntryUuid: string;
      bashInput: BashInput;
      toolResult: ParsedTranscriptEntry | null;
    }
  | {
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
export type NavAction =
  // Initialize stack with first session
  | { type: 'INIT'; sessionId: string | null }

  // Push deeper into navigation hierarchy
  | { type: 'PUSH_TRANSCRIPT'; sessionId: string }
  | {
      type: 'PUSH_TOOL_DETAIL';
      sessionId: string;
      toolEntryUuid: string;
      allTranscriptEntries: ParsedTranscriptEntry[];
    }
  | {
      type: 'PUSH_PLAN_DETAIL';
      sessionId: string;
      planEntryUuid: string;
      plan: string;
      allowedPrompts?: Array<{ tool: string; prompt: string }>;
    }
  | {
      type: 'PUSH_EDIT_DETAIL';
      sessionId: string;
      editEntryUuid: string;
      editInput: EditInput;
    }
  | {
      type: 'PUSH_WRITE_DETAIL';
      sessionId: string;
      writeEntryUuid: string;
      writeInput: WriteInput;
    }
  | {
      type: 'PUSH_BASH_DETAIL';
      sessionId: string;
      bashEntryUuid: string;
      bashInput: BashInput;
      toolResult: ParsedTranscriptEntry | null;
    }
  | {
      type: 'PUSH_GREP_DETAIL';
      sessionId: string;
      grepEntryUuid: string;
      grepInput: GrepInput;
      toolResult: ParsedTranscriptEntry | null;
    }

  // Pop back one level
  | { type: 'POP' }

  // Update selection on top of stack (for list view)
  | { type: 'UPDATE_SESSION_SELECTION'; sessionId: string | null }

  // Update transcript scroll position
  | { type: 'UPDATE_TRANSCRIPT_POSITION'; selectedUuid: string };

/**
 * Navigation Reducer
 *
 * Pure function that handles all navigation state transitions.
 */
export function navigationReducer(state: NavState, action: NavAction): NavState {
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
export function useNavigation(initialSessionId: string | null) {
  const [state, dispatch] = useReducer(navigationReducer, {
    stack: [{ type: 'list', selectedSessionId: initialSessionId }],
  });

  const currentView = state.stack[state.stack.length - 1];
  const depth = state.stack.length;

  // Memoize navigation methods to prevent unnecessary re-renders
  const selectSession = useCallback(
    (sessionId: string | null) => dispatch({ type: 'UPDATE_SESSION_SELECTION', sessionId }),
    []
  );

  const pushTranscript = useCallback(
    (sessionId: string) => dispatch({ type: 'PUSH_TRANSCRIPT', sessionId }),
    []
  );

  const pushToolDetail = useCallback(
    (sessionId: string, toolEntryUuid: string, allEntries: ParsedTranscriptEntry[]) =>
      dispatch({
        type: 'PUSH_TOOL_DETAIL',
        sessionId,
        toolEntryUuid,
        allTranscriptEntries: allEntries,
      }),
    []
  );

  const pushPlanDetail = useCallback(
    (
      sessionId: string,
      planEntryUuid: string,
      plan: string,
      allowedPrompts?: Array<{ tool: string; prompt: string }>
    ) =>
      dispatch({
        type: 'PUSH_PLAN_DETAIL',
        sessionId,
        planEntryUuid,
        plan,
        allowedPrompts,
      }),
    []
  );

  const pushEditDetail = useCallback(
    (sessionId: string, editEntryUuid: string, editInput: EditInput) =>
      dispatch({
        type: 'PUSH_EDIT_DETAIL',
        sessionId,
        editEntryUuid,
        editInput,
      }),
    []
  );

  const pushWriteDetail = useCallback(
    (sessionId: string, writeEntryUuid: string, writeInput: WriteInput) =>
      dispatch({
        type: 'PUSH_WRITE_DETAIL',
        sessionId,
        writeEntryUuid,
        writeInput,
      }),
    []
  );

  const pushBashDetail = useCallback(
    (sessionId: string, bashEntryUuid: string, bashInput: BashInput, toolResult: ParsedTranscriptEntry | null) =>
      dispatch({
        type: 'PUSH_BASH_DETAIL',
        sessionId,
        bashEntryUuid,
        bashInput,
        toolResult,
      }),
    []
  );

  const pushGrepDetail = useCallback(
    (sessionId: string, grepEntryUuid: string, grepInput: GrepInput, toolResult: ParsedTranscriptEntry | null) =>
      dispatch({
        type: 'PUSH_GREP_DETAIL',
        sessionId,
        grepEntryUuid,
        grepInput,
        toolResult,
      }),
    []
  );

  const pop = useCallback(() => dispatch({ type: 'POP' }), []);

  const updateTranscriptPosition = useCallback(
    (selectedUuid: string) => dispatch({ type: 'UPDATE_TRANSCRIPT_POSITION', selectedUuid }),
    []
  );

  // Return a stable object reference using useMemo
  return useMemo(
    () => ({
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
    }),
    [currentView, depth, state.stack, dispatch, selectSession, pushTranscript, pushToolDetail, pushPlanDetail, pushEditDetail, pushWriteDetail, pushBashDetail, pushGrepDetail, pop, updateTranscriptPosition]
  );
}

/**
 * Type guard to check if current view is list view
 */
export function isListView(view: NavStackItem): view is Extract<NavStackItem, { type: 'list' }> {
  return view.type === 'list';
}

/**
 * Type guard to check if current view is transcript view
 */
export function isTranscriptView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'transcript' }> {
  return view.type === 'transcript';
}

/**
 * Type guard to check if current view is tool detail view
 */
export function isToolDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'tool-detail' }> {
  return view.type === 'tool-detail';
}

/**
 * Type guard to check if current view is plan detail view
 */
export function isPlanDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'plan-detail' }> {
  return view.type === 'plan-detail';
}

/**
 * Type guard to check if current view is edit detail view
 */
export function isEditDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'edit-detail' }> {
  return view.type === 'edit-detail';
}

/**
 * Type guard to check if current view is write detail view
 */
export function isWriteDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'write-detail' }> {
  return view.type === 'write-detail';
}

/**
 * Type guard to check if current view is bash detail view
 */
export function isBashDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'bash-detail' }> {
  return view.type === 'bash-detail';
}

/**
 * Type guard to check if current view is grep detail view
 */
export function isGrepDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'grep-detail' }> {
  return view.type === 'grep-detail';
}
