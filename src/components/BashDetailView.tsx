import React from 'react';
import { Box, Text } from 'ink';
import { CodeViewer } from './code-viewer/index.js';
import { BashInput } from './tools/ToolDisplayProps.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';

export interface BashDetailViewProps {
  bashInput: BashInput;
  toolResult: ParsedTranscriptEntry | null;
}

/**
 * Detail view for Bash tool showing command and full output
 */
export function BashDetailView({ bashInput, toolResult }: BashDetailViewProps) {
  const { command, description, timeout, run_in_background } = bashInput;

  // Get output from tool result
  const output = toolResult?.content || '';
  const isError = toolResult?.isError || false;
  const isPending = !toolResult;

  // Calculate stats
  const lineCount = output ? output.split('\n').length : 0;

  // Determine status text and color
  let statusText: string;
  let statusColor: string;
  if (isPending) {
    statusText = 'Pending';
    statusColor = 'yellow';
  } else if (isError) {
    statusText = 'Error';
    statusColor = 'red';
  } else {
    statusText = 'Success';
    statusColor = 'green';
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box
        borderStyle="single"
        borderColor={isError ? 'red' : 'cyan'}
        paddingX={1}
        marginBottom={1}
      >
        <Text bold color={isError ? 'red' : 'cyan'}>
          Bash: {command.length > 50 ? command.substring(0, 50) + '...' : command}
        </Text>
      </Box>

      {/* Description if available */}
      {description && (
        <Box marginBottom={1}>
          <Text>{description}</Text>
        </Box>
      )}

      {/* Flags/options */}
      {(timeout || run_in_background) && (
        <Box marginBottom={1}>
          {timeout && <Text dimColor>Timeout: {timeout}ms </Text>}
          {run_in_background && <Text dimColor>[background]</Text>}
        </Box>
      )}

      {/* Status */}
      <Box marginBottom={1}>
        <Text dimColor>Status: </Text>
        <Text color={statusColor} bold>{statusText}</Text>
        {lineCount > 0 && <Text dimColor> ({lineCount} lines)</Text>}
      </Box>

      {/* Output */}
      {output ? (
        <Box marginBottom={1}>
          <CodeViewer
            code={output}
            language={isError ? 'output (error)' : 'output'}
            showLineNumbers={true}
          />
        </Box>
      ) : isPending ? (
        <Box marginBottom={1}>
          <Text dimColor>Waiting for command to complete...</Text>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text dimColor>No output</Text>
        </Box>
      )}

      {/* Footer with help */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          ESC: back to transcript
        </Text>
      </Box>
    </Box>
  );
}
