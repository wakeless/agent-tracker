import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isWriteInput } from './ToolDisplayProps.js';

export function WriteTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isWriteInput(toolInput)) {
    return <Text dimColor>Invalid Write input</Text>;
  }

  const { file_path, content } = toolInput;

  // Extract just the filename from the path
  const fileName = file_path.split('/').pop() || file_path;

  // Calculate stats
  const lines = content.split('\n');
  const lineCount = lines.length;

  if (mode === 'collapsed') {
    return (
      <Text>
        <Text dimColor>+ </Text>
        {fileName}
        <Text dimColor> ({lineCount} lines)</Text>
      </Text>
    );
  }

  // Expanded mode - show file path and preview
  const charCount = content.length;

  // Show first few lines as preview
  const previewLines = lines.slice(0, 5);
  const hasMore = lines.length > 5;

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>File: </Text>
        <Text>{file_path}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Writing {lineCount} line{lineCount !== 1 ? 's' : ''} ({charCount} chars)
        </Text>
      </Box>

      {/* Preview */}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>Preview:</Text>
        {previewLines.map((line, idx) => (
          <Box key={idx} marginLeft={2}>
            <Text dimColor>{String(idx + 1).padStart(3, ' ')} │ </Text>
            <Text>{line || ' '}</Text>
          </Box>
        ))}
        {hasMore && (
          <Box marginLeft={2}>
            <Text dimColor>    │ ...</Text>
          </Box>
        )}
      </Box>

      {/* Enter hint */}
      <Box marginTop={1}>
        <Text color="cyan">Press Enter to view full content →</Text>
      </Box>
    </Box>
  );
}
