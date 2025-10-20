import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isWebFetchInput } from './ToolDisplayProps.js';

export function WebFetchTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isWebFetchInput(toolInput)) {
    return <Text dimColor>Invalid WebFetch input</Text>;
  }

  const { url, prompt } = toolInput;

  // Extract domain from URL
  const getDomain = (urlString: string): string => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return urlString;
    }
  };

  if (mode === 'collapsed') {
    const domain = getDomain(url);
    return (
      <Text>
        <Text dimColor>🌐 </Text>
        {domain}
      </Text>
    );
  }

  // Expanded mode - show full URL and prompt summary
  const maxPromptLength = 100;
  const promptSummary = prompt.length > maxPromptLength
    ? prompt.substring(0, maxPromptLength) + '...'
    : prompt;

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>URL: </Text>
        <Text>{url}</Text>
      </Box>
      <Box marginTop={1}>
        <Text bold>Prompt: </Text>
        <Text dimColor>{promptSummary}</Text>
      </Box>
    </Box>
  );
}
