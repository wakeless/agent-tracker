import React from 'react';
import { Box, Text } from 'ink';
import { DiffViewer } from './code-viewer/index.js';
import { EditInput } from './tools/ToolDisplayProps.js';

export interface EditDetailViewProps {
  editInput: EditInput;
}

/**
 * Detail view for Edit tool showing full diff visualization
 */
export function EditDetailView({ editInput }: EditDetailViewProps) {
  const { file_path, old_string, new_string, replace_all } = editInput;

  // Calculate some stats
  const oldLines = old_string.split('\n').length;
  const newLines = new_string.split('\n').length;
  const oldChars = old_string.length;
  const newChars = new_string.length;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box
        borderStyle="single"
        borderColor="cyan"
        paddingX={1}
        marginBottom={1}
      >
        <Text bold color="cyan">
          Edit: {file_path}
        </Text>
      </Box>

      {/* Stats */}
      <Box marginBottom={1}>
        <Text dimColor>
          Replacing {oldLines} line{oldLines !== 1 ? 's' : ''} ({oldChars} chars) with {newLines} line{newLines !== 1 ? 's' : ''} ({newChars} chars)
        </Text>
        {replace_all && (
          <Text color="yellow"> [replace all occurrences]</Text>
        )}
      </Box>

      {/* Diff visualization */}
      <Box marginBottom={1}>
        <DiffViewer
          oldText={old_string}
          newText={new_string}
          oldLabel="before"
          newLabel="after"
          showAllLines={true}
        />
      </Box>

      {/* Footer with help */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          ESC: back to transcript
        </Text>
      </Box>
    </Box>
  );
}
