import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isEditInput } from './ToolDisplayProps.js';

export function EditTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isEditInput(toolInput)) {
    return <Text dimColor>Invalid Edit input</Text>;
  }

  const { file_path, old_string, new_string, replace_all } = toolInput;

  // Extract just the filename from the path
  const fileName = file_path.split('/').pop() || file_path;

  if (mode === 'collapsed') {
    return (
      <Text>
        <Text dimColor>✎ </Text>
        {fileName}
        {replace_all && <Text dimColor> (replace all)</Text>}
      </Text>
    );
  }

  // Expanded mode - show file path and edit details
  const oldLines = old_string.split('\n').length;
  const newLines = new_string.split('\n').length;
  const oldChars = old_string.length;
  const newChars = new_string.length;

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>File: </Text>
        <Text>{file_path}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Replacing {oldLines} line{oldLines !== 1 ? 's' : ''} ({oldChars} chars) with {newLines} line{newLines !== 1 ? 's' : ''} ({newChars} chars)
        </Text>
      </Box>
      {replace_all && (
        <Box>
          <Text color="yellow">Replace all occurrences</Text>
        </Box>
      )}
    </Box>
  );
}
