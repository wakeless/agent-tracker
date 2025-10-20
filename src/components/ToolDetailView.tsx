import React from 'react';
import { Box, Text } from 'ink';
import { ParsedTranscriptEntry } from '../types/transcript.js';
import { MarkdownText } from './MarkdownText.js';

interface ToolDetailViewProps {
  toolUseEntry: ParsedTranscriptEntry;
  toolResultEntry: ParsedTranscriptEntry | null;
}

export function ToolDetailView({ toolUseEntry, toolResultEntry }: ToolDetailViewProps) {
  // Keyboard input (ESC) is handled globally by App.tsx navigation stack

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const toolName = toolUseEntry.toolName || 'Unknown Tool';
  const hasError = toolResultEntry?.isError === true;
  const statusColor = hasError ? 'red' : toolResultEntry ? 'green' : 'yellow';
  const statusText = hasError ? 'Error' : toolResultEntry ? 'Success' : 'Pending';

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Tool Detail
        </Text>
        <Text dimColor> - {toolName}</Text>
      </Box>

      {/* Tool Status */}
      <Box marginBottom={1}>
        <Text dimColor>Status: </Text>
        <Text bold color={statusColor}>
          {statusText}
        </Text>
        <Text dimColor> • Executed at {formatTime(toolUseEntry.timestamp)}</Text>
      </Box>

      {/* Tool Input */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">
          Input Parameters:
        </Text>
        <Box marginLeft={2} marginTop={1} flexDirection="column">
          {toolUseEntry.toolInput ? (
            <MarkdownText>
              {'```json\n' + JSON.stringify(toolUseEntry.toolInput, null, 2) + '\n```'}
            </MarkdownText>
          ) : (
            <Text dimColor>(no input)</Text>
          )}
        </Box>
      </Box>

      {/* Tool Output */}
      {toolResultEntry && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color={hasError ? 'red' : 'green'}>
            {hasError ? 'Error Output:' : 'Output:'}
          </Text>
          <Box marginLeft={2} marginTop={1} flexDirection="column">
            <MarkdownText>{toolResultEntry.content}</MarkdownText>
          </Box>
        </Box>
      )}

      {!toolResultEntry && (
        <Box marginBottom={1}>
          <Text dimColor>No output available (tool execution may still be pending)</Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>ESC: Back to transcript</Text>
      </Box>
    </Box>
  );
}
