import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TaskReader, Task } from '@agent-tracker/core';

interface TaskSetDetailViewProps {
  conversationId: string;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  onViewTask: (task: Task) => void;
  onBack: () => void;
}

/**
 * Get status indicator for display
 */
function getStatusIndicator(status: string): { symbol: string; color: string } {
  switch (status) {
    case 'in_progress':
      return { symbol: '*', color: 'yellow' };
    case 'completed':
      return { symbol: '+', color: 'green' };
    default:
      return { symbol: ' ', color: 'gray' };
  }
}

/**
 * Get status label for display
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Pending';
  }
}

/**
 * Truncate text to fit in a specific width
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '...';
}

export function TaskSetDetailView({
  conversationId,
  selectedTaskId,
  onSelectTask,
  onViewTask,
  onBack,
}: TaskSetDetailViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load tasks on mount
  useEffect(() => {
    const reader = new TaskReader();
    const loadedTasks = reader.getTasksForConversation(conversationId);
    setTasks(loadedTasks);

    // Select first if none selected
    if (loadedTasks.length > 0 && !selectedTaskId) {
      onSelectTask(loadedTasks[0].id);
    }
  }, [conversationId]);

  // Update selected task when selection changes
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId) || null;
      setSelectedTask(task);
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskId, tasks]);

  // Calculate task counts
  const counts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  // Keyboard navigation
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      const currentIdx = tasks.findIndex((t) => t.id === selectedTaskId);
      if (currentIdx > 0) {
        onSelectTask(tasks[currentIdx - 1].id);
      }
    } else if (key.downArrow || input === 'j') {
      const currentIdx = tasks.findIndex((t) => t.id === selectedTaskId);
      if (currentIdx >= 0 && currentIdx < tasks.length - 1) {
        onSelectTask(tasks[currentIdx + 1].id);
      }
    } else if (key.return && selectedTask) {
      onViewTask(selectedTask);
    } else if (key.escape || input === 'h') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="yellow">
          Task Set
        </Text>
        <Text dimColor> - {truncate(conversationId, 36)}</Text>
      </Box>

      {/* Stats Bar */}
      <Box marginBottom={1}>
        <Box marginRight={2}>
          <Text>Total: </Text>
          <Text bold>{tasks.length}</Text>
        </Box>
        <Box marginRight={2}>
          <Text dimColor>Pending: </Text>
          <Text color="gray">{counts.pending}</Text>
        </Box>
        <Box marginRight={2}>
          <Text dimColor>Active: </Text>
          <Text color="yellow">{counts.inProgress}</Text>
        </Box>
        <Box marginRight={2}>
          <Text dimColor>Done: </Text>
          <Text color="green">{counts.completed}</Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box borderStyle="round" borderColor="gray" height={18}>
        {/* Left Panel - Task List */}
        <Box flexDirection="column" width={45} borderStyle="single" borderColor="gray" padding={1}>
          {tasks.length === 0 ? (
            <Text dimColor>No tasks found</Text>
          ) : (
            tasks.map((task) => {
              const isSelected = task.id === selectedTaskId;
              const status = getStatusIndicator(task.status);
              return (
                <Box key={task.id}>
                  {isSelected ? (
                    <Text color="cyan" bold>
                      {'> '}
                    </Text>
                  ) : (
                    <Text>{'  '}</Text>
                  )}
                  <Text dimColor>#{task.id} </Text>
                  <Text color={status.color}>{status.symbol}</Text>
                  <Text> </Text>
                  <Text color={isSelected ? 'cyan' : undefined} bold={isSelected} wrap="truncate">
                    {truncate(task.subject, 32)}
                  </Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* Right Panel - Task Preview */}
        <Box flexDirection="column" flexGrow={1} padding={1}>
          {selectedTask ? (
            <>
              {/* Task Header */}
              <Box marginBottom={1}>
                <Text bold color="white">
                  #{selectedTask.id}: {truncate(selectedTask.subject, 40)}
                </Text>
              </Box>

              {/* Status */}
              <Box marginBottom={1}>
                <Text dimColor>Status: </Text>
                <Text color={getStatusIndicator(selectedTask.status).color}>
                  {getStatusLabel(selectedTask.status)}
                </Text>
              </Box>

              {/* Active Form */}
              {selectedTask.activeForm && selectedTask.status === 'in_progress' && (
                <Box marginBottom={1}>
                  <Text dimColor>Active: </Text>
                  <Text color="yellow">{selectedTask.activeForm}</Text>
                </Box>
              )}

              {/* Dependencies */}
              {(selectedTask.blocks.length > 0 || selectedTask.blockedBy.length > 0) && (
                <Box flexDirection="column" marginBottom={1}>
                  {selectedTask.blockedBy.length > 0 && (
                    <Box>
                      <Text dimColor>Blocked by: </Text>
                      <Text color="red">{selectedTask.blockedBy.join(', ')}</Text>
                    </Box>
                  )}
                  {selectedTask.blocks.length > 0 && (
                    <Box>
                      <Text dimColor>Blocks: </Text>
                      <Text color="blue">{selectedTask.blocks.join(', ')}</Text>
                    </Box>
                  )}
                </Box>
              )}

              {/* Description Preview */}
              <Box flexDirection="column">
                <Text bold dimColor>
                  Description:
                </Text>
                <Text wrap="wrap">
                  {truncate(selectedTask.description || '(no description)', 200)}
                </Text>
              </Box>
            </>
          ) : (
            <Box>
              <Text dimColor>Select a task to preview</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          Navigation: j/k • Enter: View task • Esc/h: Back • Quit: q or Ctrl+C
        </Text>
      </Box>
    </Box>
  );
}
