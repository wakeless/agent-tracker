import React from 'react';
import { Box, Text } from 'ink';

export function EmptyState() {
  return (
    <Box flexDirection="column" padding={2}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Agent Tracker
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text>
          No Claude Code sessions found.
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>
          Start a Claude Code session to begin tracking. Sessions will appear
        </Text>
      </Box>
      <Box>
        <Text dimColor>
          automatically as you use Claude Code in any project.
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Looking for sessions in: ~/.claude/projects/
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Press q or Ctrl+C to quit
        </Text>
      </Box>
    </Box>
  );
}
