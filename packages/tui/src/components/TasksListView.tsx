import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { TaskReader, TaskSummary, Task } from '@agent-tracker/core';

interface TasksListViewProps {
  selectedConversationId: string | null;
  onSelectTaskSet: (conversationId: string | null) => void;
  onViewTaskSet: (conversationId: string) => void;
  onSwitchToSessions: () => void;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Truncate UUID for display
 */
function truncateId(id: string, maxLength: number = 8): string {
  if (id.length <= maxLength) return id;
  return id.substring(0, maxLength) + '...';
}

/**
 * Get status color for display
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'yellow';
    case 'completed':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get a preview of tasks from a conversation
 */
function getTaskPreview(reader: TaskReader, conversationId: string): Task[] {
  return reader.getTasksForConversation(conversationId).slice(0, 5);
}

export function TasksListView({
  selectedConversationId,
  onSelectTaskSet,
  onViewTaskSet,
  onSwitchToSessions,
}: TasksListViewProps) {
  const [taskSets, setTaskSets] = useState<TaskSummary[]>([]);
  const [previewTasks, setPreviewTasks] = useState<Task[]>([]);

  // Load task sets on mount
  useEffect(() => {
    const reader = new TaskReader();
    const summaries = reader.scanTaskSets();
    setTaskSets(summaries);

    // Select first if none selected
    if (summaries.length > 0 && !selectedConversationId) {
      onSelectTaskSet(summaries[0].conversationId);
    }
  }, []);

  // Load preview for selected task set
  useEffect(() => {
    if (!selectedConversationId) {
      setPreviewTasks([]);
      return;
    }

    const reader = new TaskReader();
    const tasks = getTaskPreview(reader, selectedConversationId);
    setPreviewTasks(tasks);
  }, [selectedConversationId]);

  // Keyboard navigation
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      const currentIdx = taskSets.findIndex((ts) => ts.conversationId === selectedConversationId);
      if (currentIdx > 0) {
        onSelectTaskSet(taskSets[currentIdx - 1].conversationId);
      }
    } else if (key.downArrow || input === 'j') {
      const currentIdx = taskSets.findIndex((ts) => ts.conversationId === selectedConversationId);
      if (currentIdx >= 0 && currentIdx < taskSets.length - 1) {
        onSelectTaskSet(taskSets[currentIdx + 1].conversationId);
      }
    } else if (key.return && selectedConversationId) {
      onViewTaskSet(selectedConversationId);
    } else if (key.tab || input === 't') {
      onSwitchToSessions();
    }
  });

  const selectedTaskSet = taskSets.find((ts) => ts.conversationId === selectedConversationId) || null;

  // Calculate totals
  const totals = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    for (const ts of taskSets) {
      pending += ts.pending;
      inProgress += ts.inProgress;
      completed += ts.completed;
    }
    return { pending, inProgress, completed };
  }, [taskSets]);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="yellow">
          Task Explorer
        </Text>
        <Text dimColor> - Browse ~/.claude/tasks/</Text>
      </Box>

      {/* Stats Bar */}
      <Box marginBottom={1}>
        <Box marginRight={2}>
          <Text>Conversations: </Text>
          <Text bold>{taskSets.length}</Text>
        </Box>
        <Box marginRight={2}>
          <Text dimColor>Pending: </Text>
          <Text color="gray">{totals.pending}</Text>
        </Box>
        <Box marginRight={2}>
          <Text dimColor>Active: </Text>
          <Text color="yellow">{totals.inProgress}</Text>
        </Box>
        <Box marginRight={2}>
          <Text dimColor>Done: </Text>
          <Text color="green">{totals.completed}</Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box borderStyle="round" borderColor="gray" height={20}>
        {/* Left Panel - Task Set List */}
        <Box flexDirection="column" width={45} borderStyle="single" borderColor="gray" padding={1}>
          {taskSets.length === 0 ? (
            <Text dimColor>No task sets found</Text>
          ) : (
            taskSets.map((ts) => {
              const isSelected = ts.conversationId === selectedConversationId;
              return (
                <Box key={ts.conversationId}>
                  {isSelected ? (
                    <Text color="cyan" bold>
                      {'> '}
                    </Text>
                  ) : (
                    <Text>{'  '}</Text>
                  )}
                  <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
                    {truncateId(ts.conversationId, 12)}
                  </Text>
                  <Text dimColor> </Text>
                  <Text color="gray">{ts.pending}p</Text>
                  <Text dimColor>/</Text>
                  <Text color="yellow">{ts.inProgress}a</Text>
                  <Text dimColor>/</Text>
                  <Text color="green">{ts.completed}d</Text>
                  <Text dimColor> {formatDate(ts.lastModified)}</Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* Right Panel - Task Preview */}
        <Box flexDirection="column" flexGrow={1} padding={1}>
          {selectedTaskSet && previewTasks.length > 0 ? (
            <>
              {/* Task Set Header */}
              <Box marginBottom={1}>
                <Text bold color="white">
                  {selectedTaskSet.taskCount} Tasks
                </Text>
              </Box>
              <Box marginBottom={1}>
                <Text dimColor>
                  Conversation: {selectedTaskSet.conversationId}
                </Text>
              </Box>

              {/* Task Preview List */}
              <Box flexDirection="column">
                <Text bold dimColor>
                  Tasks:
                </Text>
                {previewTasks.map((task, idx) => (
                  <Box key={task.id}>
                    <Text dimColor>#{task.id} </Text>
                    <Text color={getStatusColor(task.status)}>
                      {task.status === 'in_progress' ? '*' : task.status === 'completed' ? '+' : ' '}
                    </Text>
                    <Text> </Text>
                    <Text wrap="truncate">{task.subject.substring(0, 40)}</Text>
                  </Box>
                ))}
                {selectedTaskSet.taskCount > 5 && (
                  <Text dimColor>... and {selectedTaskSet.taskCount - 5} more</Text>
                )}
              </Box>
            </>
          ) : (
            <Box>
              <Text dimColor>Select a task set to preview</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          Navigation: j/k • Enter: View tasks • Tab: Switch views • Quit: q or Ctrl+C
        </Text>
      </Box>
    </Box>
  );
}
