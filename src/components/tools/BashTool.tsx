import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isBashInput } from './ToolDisplayProps.js';

export function BashTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isBashInput(toolInput)) {
    return <Text dimColor>Invalid Bash input</Text>;
  }

  const { command, description } = toolInput;

  if (mode === 'collapsed') {
    // Prefer description if available, otherwise show command
    if (description) {
      return <Text>{description}</Text>;
    }

    // Truncate long commands in collapsed mode
    const maxLength = 60;
    const displayCommand = command.length > maxLength
      ? command.substring(0, maxLength) + '...'
      : command;

    return (
      <Text>
        <Text dimColor>$ </Text>
        {displayCommand}
      </Text>
    );
  }

  // Expanded mode - show both command and description
  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor>$ </Text>
        <Text>{command}</Text>
      </Box>
      {description && (
        <Box marginTop={1}>
          <Text dimColor>{description}</Text>
        </Box>
      )}
    </Box>
  );
}
