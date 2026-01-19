import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps } from './ToolDisplayProps.js';

export function GenericTool({ toolName, toolInput, mode }: ToolDisplayProps) {
  if (mode === 'collapsed') {
    return <Text dimColor>Used tool: {toolName}</Text>;
  }

  // Expanded mode - show JSON but formatted
  return (
    <Box flexDirection="column">
      <Text dimColor>Input:</Text>
      <Box marginLeft={2}>
        <Text dimColor>{JSON.stringify(toolInput, null, 2)}</Text>
      </Box>
    </Box>
  );
}
