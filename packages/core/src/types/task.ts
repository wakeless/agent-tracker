/**
 * Task Types
 *
 * Types for Claude Code's task management system.
 * Tasks are stored in ~/.claude/tasks/{conversation-uuid}/*.json
 */

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * A single task from a conversation's task list
 */
export interface Task {
  /** Task identifier (e.g., "1", "2") */
  id: string;
  /** Brief title for the task */
  subject: string;
  /** Detailed description of what needs to be done */
  description: string;
  /** Present continuous form shown in spinner when in_progress (e.g., "Running tests") */
  activeForm: string;
  /** Task status */
  status: TaskStatus;
  /** Task IDs that this task blocks */
  blocks: string[];
  /** Task IDs that must complete before this task can start */
  blockedBy: string[];
}

/**
 * A set of tasks for a single conversation
 */
export interface TaskSet {
  /** Conversation UUID */
  conversationId: string;
  /** All tasks in this conversation */
  tasks: Task[];
  /** Last modification time of any task file */
  lastModified: Date;
}

/**
 * Summary of tasks for a conversation (for list views)
 */
export interface TaskSummary {
  /** Conversation UUID */
  conversationId: string;
  /** Total number of tasks */
  taskCount: number;
  /** Number of pending tasks */
  pending: number;
  /** Number of in-progress tasks */
  inProgress: number;
  /** Number of completed tasks */
  completed: number;
  /** Last modification time of any task file */
  lastModified: Date;
}
