import { useReducer, useCallback, useMemo } from 'react';
import { ParsedTranscriptEntry, PlanFile, Task, TaskSummary } from '@agent-tracker/core';
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
    }
  // Plans navigation (parallel to sessions)
  | {
      type: 'plans-list';
      selectedPlanFilename: string | null;
    }
  | {
      type: 'plan-file-detail';
      planFile: PlanFile;
      planContent: string;
    }
  // Tasks navigation (parallel to sessions and plans)
  | {
      type: 'tasks-list';
      selectedConversationId: string | null;
    }
  | {
      type: 'task-set-detail';
      conversationId: string;
      selectedTaskId: string | null;
    }
  | {
      type: 'task-detail';
      conversationId: string;
      task: Task;
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
  | { type: 'UPDATE_TRANSCRIPT_POSITION'; selectedUuid: string }

  // Switch between sessions, plans, and tasks views
  | { type: 'SWITCH_TO_PLANS' }
  | { type: 'SWITCH_TO_SESSIONS' }
  | { type: 'SWITCH_TO_TASKS' }

  // Plans navigation
  | { type: 'PUSH_PLAN_FILE_DETAIL'; planFile: PlanFile; planContent: string }
  | { type: 'UPDATE_PLAN_SELECTION'; planFilename: string | null }

  // Tasks navigation
  | { type: 'PUSH_TASK_SET_DETAIL'; conversationId: string }
  | { type: 'PUSH_TASK_DETAIL'; conversationId: string; task: Task }
  | { type: 'UPDATE_TASK_SET_SELECTION'; conversationId: string | null }
  | { type: 'UPDATE_TASK_SELECTION'; taskId: string | null };

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

    case 'SWITCH_TO_PLANS':
      // Replace entire stack with plans-list view
      return {
        stack: [{ type: 'plans-list', selectedPlanFilename: null }],
      };

    case 'SWITCH_TO_SESSIONS':
      // Replace entire stack with session list view
      return {
        stack: [{ type: 'list', selectedSessionId: null }],
      };

    case 'PUSH_PLAN_FILE_DETAIL':
      return {
        stack: [
          ...state.stack,
          {
            type: 'plan-file-detail',
            planFile: action.planFile,
            planContent: action.planContent,
          },
        ],
      };

    case 'UPDATE_PLAN_SELECTION': {
      // Only update if top of stack is plans-list view
      const top = state.stack[state.stack.length - 1];
      if (top.type !== 'plans-list') {
        return state;
      }

      return {
        stack: [
          ...state.stack.slice(0, -1),
          { type: 'plans-list', selectedPlanFilename: action.planFilename },
        ],
      };
    }

    case 'SWITCH_TO_TASKS':
      // Replace entire stack with tasks-list view
      return {
        stack: [{ type: 'tasks-list', selectedConversationId: null }],
      };

    case 'PUSH_TASK_SET_DETAIL':
      return {
        stack: [
          ...state.stack,
          {
            type: 'task-set-detail',
            conversationId: action.conversationId,
            selectedTaskId: null,
          },
        ],
      };

    case 'PUSH_TASK_DETAIL':
      return {
        stack: [
          ...state.stack,
          {
            type: 'task-detail',
            conversationId: action.conversationId,
            task: action.task,
          },
        ],
      };

    case 'UPDATE_TASK_SET_SELECTION': {
      // Only update if top of stack is tasks-list view
      const top = state.stack[state.stack.length - 1];
      if (top.type !== 'tasks-list') {
        return state;
      }

      return {
        stack: [
          ...state.stack.slice(0, -1),
          { type: 'tasks-list', selectedConversationId: action.conversationId },
        ],
      };
    }

    case 'UPDATE_TASK_SELECTION': {
      // Only update if top of stack is task-set-detail view
      const top = state.stack[state.stack.length - 1];
      if (top.type !== 'task-set-detail') {
        return state;
      }

      return {
        stack: [
          ...state.stack.slice(0, -1),
          { ...top, selectedTaskId: action.taskId },
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

  // Plans navigation methods
  const switchToPlans = useCallback(() => dispatch({ type: 'SWITCH_TO_PLANS' }), []);

  const switchToSessions = useCallback(() => dispatch({ type: 'SWITCH_TO_SESSIONS' }), []);

  const pushPlanFileDetail = useCallback(
    (planFile: PlanFile, planContent: string) =>
      dispatch({ type: 'PUSH_PLAN_FILE_DETAIL', planFile, planContent }),
    []
  );

  const selectPlan = useCallback(
    (planFilename: string | null) => dispatch({ type: 'UPDATE_PLAN_SELECTION', planFilename }),
    []
  );

  // Tasks navigation methods
  const switchToTasks = useCallback(() => dispatch({ type: 'SWITCH_TO_TASKS' }), []);

  const pushTaskSetDetail = useCallback(
    (conversationId: string) => dispatch({ type: 'PUSH_TASK_SET_DETAIL', conversationId }),
    []
  );

  const pushTaskDetail = useCallback(
    (conversationId: string, task: Task) =>
      dispatch({ type: 'PUSH_TASK_DETAIL', conversationId, task }),
    []
  );

  const selectTaskSet = useCallback(
    (conversationId: string | null) =>
      dispatch({ type: 'UPDATE_TASK_SET_SELECTION', conversationId }),
    []
  );

  const selectTask = useCallback(
    (taskId: string | null) => dispatch({ type: 'UPDATE_TASK_SELECTION', taskId }),
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

      // Session convenience methods (now stable)
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

      // Plans navigation methods
      switchToPlans,
      switchToSessions,
      pushPlanFileDetail,
      selectPlan,

      // Tasks navigation methods
      switchToTasks,
      pushTaskSetDetail,
      pushTaskDetail,
      selectTaskSet,
      selectTask,
    }),
    [currentView, depth, state.stack, dispatch, selectSession, pushTranscript, pushToolDetail, pushPlanDetail, pushEditDetail, pushWriteDetail, pushBashDetail, pushGrepDetail, pop, updateTranscriptPosition, switchToPlans, switchToSessions, pushPlanFileDetail, selectPlan, switchToTasks, pushTaskSetDetail, pushTaskDetail, selectTaskSet, selectTask]
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

/**
 * Type guard to check if current view is plans list view
 */
export function isPlansListView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'plans-list' }> {
  return view.type === 'plans-list';
}

/**
 * Type guard to check if current view is plan file detail view
 */
export function isPlanFileDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'plan-file-detail' }> {
  return view.type === 'plan-file-detail';
}

/**
 * Type guard to check if current view is tasks list view
 */
export function isTasksListView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'tasks-list' }> {
  return view.type === 'tasks-list';
}

/**
 * Type guard to check if current view is task set detail view
 */
export function isTaskSetDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'task-set-detail' }> {
  return view.type === 'task-set-detail';
}

/**
 * Type guard to check if current view is task detail view
 */
export function isTaskDetailView(
  view: NavStackItem
): view is Extract<NavStackItem, { type: 'task-detail' }> {
  return view.type === 'task-detail';
}
