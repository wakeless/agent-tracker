import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Task } from '@agent-tracker/core';

interface TaskDetailViewProps {
  task: Task;
  conversationId: string;
  onBack: () => void;
}

/**
 * Get status color and label for display
 */
function getStatus(status: string): { color: string; label: string } {
  switch (status) {
    case 'in_progress':
      return { color: 'yellow', label: 'In Progress' };
    case 'completed':
      return { color: 'green', label: 'Completed' };
    default:
      return { color: 'gray', label: 'Pending' };
  }
}

/**
 * Truncate conversation ID for header
 */
function truncateId(id: string): string {
  if (id.length <= 36) return id;
  return id.substring(0, 8) + '...' + id.substring(id.length - 8);
}

export function TaskDetailView({ task, conversationId, onBack }: TaskDetailViewProps) {
  const status = getStatus(task.status);

  // Keyboard navigation
  useInput((input, key) => {
    if (key.escape || input === 'h' || input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="yellow">
          Task #{task.id}
        </Text>
        <Text dimColor> - {truncateId(conversationId)}</Text>
      </Box>

      {/* Task Title */}
      <Box marginBottom={1}>
        <Text bold color="white" wrap="wrap">
          {task.subject}
        </Text>
      </Box>

      {/* Status Section */}
      <Box borderStyle="round" borderColor="gray" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>Status: </Text>
            <Text color={status.color}>{status.label}</Text>
          </Box>

          {task.activeForm && task.status === 'in_progress' && (
            <Box marginBottom={1}>
              <Text bold>Active Form: </Text>
              <Text color="yellow">{task.activeForm}</Text>
            </Box>
          )}

          {/* Dependencies */}
          {task.blockedBy.length > 0 && (
            <Box marginBottom={1}>
              <Text bold>Blocked By: </Text>
              <Text color="red">{task.blockedBy.join(', ')}</Text>
            </Box>
          )}

          {task.blocks.length > 0 && (
            <Box>
              <Text bold>Blocks: </Text>
              <Text color="blue">{task.blocks.join(', ')}</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Description Section */}
      <Box borderStyle="round" borderColor="gray" padding={1} flexDirection="column" height={12}>
        <Box marginBottom={1}>
          <Text bold>Description</Text>
        </Box>
        <Text wrap="wrap">{task.description || '(no description provided)'}</Text>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>Press Esc or h to go back • q to quit</Text>
      </Box>
    </Box>
  );
}
