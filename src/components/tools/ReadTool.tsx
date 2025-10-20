import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isReadInput } from './ToolDisplayProps.js';

export function ReadTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isReadInput(toolInput)) {
    return <Text dimColor>Invalid Read input</Text>;
  }

  const { file_path, offset, limit } = toolInput;

  // Extract just the filename from the path
  const fileName = file_path.split('/').pop() || file_path;

  if (mode === 'collapsed') {
    let lineInfo = '';
    if (offset !== undefined && limit !== undefined) {
      const endLine = offset + limit;
      lineInfo = ` (lines ${offset}-${endLine})`;
    } else if (offset !== undefined) {
      lineInfo = ` (from line ${offset})`;
    } else if (limit !== undefined) {
      lineInfo = ` (first ${limit} lines)`;
    }

    return (
      <Text>
        <Text dimColor>📖 </Text>
        {fileName}
        {lineInfo && <Text dimColor>{lineInfo}</Text>}
      </Text>
    );
  }

  // Expanded mode - show full path and line range
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>File: </Text>
        <Text>{file_path}</Text>
      </Box>
      {(offset !== undefined || limit !== undefined) && (
        <Box marginTop={1}>
          <Text dimColor>
            {offset !== undefined && limit !== undefined
              ? `Reading lines ${offset}-${offset + limit}`
              : offset !== undefined
              ? `Reading from line ${offset}`
              : `Reading first ${limit} lines`}
          </Text>
        </Box>
      )}
    </Box>
  );
}
