import React from 'react';
import { Box, Text } from 'ink';
import { CodeViewer } from './code-viewer/index.js';
import { GrepInput } from './tools/ToolDisplayProps.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';

export interface GrepDetailViewProps {
  grepInput: GrepInput;
  toolResult: ParsedTranscriptEntry | null;
}

/**
 * Detail view for Grep tool showing pattern and full search results
 */
export function GrepDetailView({ grepInput, toolResult }: GrepDetailViewProps) {
  const { pattern, path, output_mode, glob, type } = grepInput;

  // Get output from tool result
  const output = toolResult?.content || '';
  const isError = toolResult?.isError || false;
  const isPending = !toolResult;

  // Calculate stats
  const lines = output ? output.split('\n').filter(line => line.trim()) : [];
  const matchCount = lines.length;

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
    statusText = `Success (${matchCount} match${matchCount !== 1 ? 'es' : ''})`;
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
          Grep: "{pattern}"
        </Text>
      </Box>

      {/* Search parameters */}
      <Box flexDirection="column" marginBottom={1}>
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
            <Text dimColor>Glob filter: </Text>
            <Text>{glob}</Text>
          </Box>
        )}
        {type && (
          <Box>
            <Text dimColor>File type: </Text>
            <Text>{type}</Text>
          </Box>
        )}
      </Box>

      {/* Status */}
      <Box marginBottom={1}>
        <Text dimColor>Status: </Text>
        <Text color={statusColor} bold>{statusText}</Text>
      </Box>

      {/* Results */}
      {output ? (
        <Box marginBottom={1}>
          <CodeViewer
            code={output}
            language={isError ? 'error' : 'results'}
            showLineNumbers={true}
          />
        </Box>
      ) : isPending ? (
        <Box marginBottom={1}>
          <Text dimColor>Waiting for search to complete...</Text>
        </Box>
      ) : (
        <Box marginBottom={1}>
          <Text dimColor>No matches found</Text>
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
