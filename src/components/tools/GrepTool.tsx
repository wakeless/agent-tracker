import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isGrepInput } from './ToolDisplayProps.js';

export function GrepTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isGrepInput(toolInput)) {
    return <Text dimColor>Invalid Grep input</Text>;
  }

  const { pattern, path, output_mode, glob, type } = toolInput;

  if (mode === 'collapsed') {
    // Show pattern with path indicator
    const pathDisplay = path ? ` (${path})` : '';
    return (
      <Text>
        <Text dimColor>🔍 </Text>
        <Text>"{pattern}"</Text>
        <Text dimColor>{pathDisplay}</Text>
      </Text>
    );
  }

  // Expanded mode - show pattern, path, and filters
  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor>Pattern: </Text>
        <Text>{pattern}</Text>
      </Box>
      {path && (
        <Box>
          <Text dimColor>Path: </Text>
          <Text>{path}</Text>
        </Box>
      )}
      {output_mode && (
        <Box>
          <Text dimColor>Output mode: </Text>
          <Text>{output_mode}</Text>
        </Box>
      )}
      {glob && (
        <Box>
          <Text dimColor>Glob: </Text>
          <Text>{glob}</Text>
        </Box>
      )}
      {type && (
        <Box>
          <Text dimColor>Type: </Text>
          <Text>{type}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor italic>Press Enter to view full results →</Text>
      </Box>
    </Box>
  );
}
