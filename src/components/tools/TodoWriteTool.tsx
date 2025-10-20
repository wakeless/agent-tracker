import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isTodoWriteInput } from './ToolDisplayProps.js';

export function TodoWriteTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isTodoWriteInput(toolInput)) {
    return <Text dimColor>Invalid TodoWrite input</Text>;
  }

  const { todos } = toolInput;

  if (mode === 'collapsed') {
    // Count by status
    const completed = todos.filter((t) => t.status === 'completed').length;
    const inProgress = todos.filter((t) => t.status === 'in_progress').length;
    const pending = todos.filter((t) => t.status === 'pending').length;

    const parts = [];
    if (completed > 0) parts.push(`${completed} done`);
    if (inProgress > 0) parts.push(`${inProgress} in progress`);
    if (pending > 0) parts.push(`${pending} pending`);

    return (
      <Text>
        Updated todos ({todos.length} task{todos.length !== 1 ? 's' : ''}: {parts.join(', ')})
      </Text>
    );
  }

  // Expanded mode - show full checklist
  return (
    <Box flexDirection="column">
      {todos.map((todo, index) => {
        const icon =
          todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '◐' : '○';
        const color =
          todo.status === 'completed' ? 'green' : todo.status === 'in_progress' ? 'yellow' : 'gray';

        return (
          <Box key={index}>
            <Text color={color}>{icon} </Text>
            <Text color={todo.status === 'completed' ? 'green' : undefined}>{todo.content}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
