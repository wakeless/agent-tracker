import { createServerFn } from '@tanstack/react-start';
import { TaskReader, TaskSummary, Task, TaskSet } from '@agent-tracker/core';

// Serialized types for JSON-safe transfer
export interface SerializedTaskSummary {
  conversationId: string;
  taskCount: number;
  pending: number;
  inProgress: number;
  completed: number;
  lastModified: string;
}

export interface SerializedTask {
  id: string;
  subject: string;
  description: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
  blocks: string[];
  blockedBy: string[];
}

export interface SerializedTaskSet {
  conversationId: string;
  tasks: SerializedTask[];
  lastModified: string;
}

function serializeTaskSummary(summary: TaskSummary): SerializedTaskSummary {
  return {
    ...summary,
    lastModified: summary.lastModified.toISOString(),
  };
}

function serializeTask(task: Task): SerializedTask {
  return {
    id: task.id,
    subject: task.subject,
    description: task.description,
    activeForm: task.activeForm,
    status: task.status,
    blocks: task.blocks,
    blockedBy: task.blockedBy,
  };
}

function serializeTaskSet(taskSet: TaskSet): SerializedTaskSet {
  return {
    conversationId: taskSet.conversationId,
    tasks: taskSet.tasks.map(serializeTask),
    lastModified: taskSet.lastModified.toISOString(),
  };
}

export interface TaskSummariesResponse {
  taskSets: SerializedTaskSummary[];
  total: number;
}

export const getTaskSummaries = createServerFn({ method: 'GET' }).handler(
  async (): Promise<TaskSummariesResponse> => {
    const reader = new TaskReader();
    const summaries = reader.scanTaskSets();

    return {
      taskSets: summaries.map(serializeTaskSummary),
      total: summaries.length,
    };
  }
);

export interface TaskSetResponse {
  taskSet: SerializedTaskSet | null;
  conversationId: string;
}

export const getTasksForConversation = createServerFn({ method: 'GET' }).handler(
  async (ctx: { data: string }): Promise<TaskSetResponse> => {
    const conversationId = ctx.data;
    const reader = new TaskReader();
    const taskSet = reader.getTaskSet(conversationId);

    return {
      taskSet: taskSet ? serializeTaskSet(taskSet) : null,
      conversationId,
    };
  }
);
