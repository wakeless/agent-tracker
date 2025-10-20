import React from 'react';
import { Box, Text } from 'ink';

export function EmptyState() {
  return (
    <Box flexDirection="column" padding={2}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Agent Tracker - Welcome!
        </Text>
      </Box>

      {/* Explanation */}
      <Box marginBottom={1}>
        <Text>
          No session events found. To start tracking Claude Code sessions, you need to install the Agent Tracker plugin.
        </Text>
      </Box>

      {/* Installation Steps */}
      <Box marginBottom={1} flexDirection="column">
        <Text bold underline>
          Installation Steps:
        </Text>
        <Box marginTop={1} marginLeft={2} flexDirection="column">
          <Text>
            1. Add the plugin marketplace (run this in a Claude Code session):
          </Text>
          <Box marginLeft={3} marginTop={0} marginBottom={1}>
            <Text color="yellow">
              /plugin marketplace add /path/to/agent-tracker
            </Text>
          </Box>

          <Text>
            2. Install the agent-tracker plugin:
          </Text>
          <Box marginLeft={3} marginTop={0} marginBottom={1}>
            <Text color="yellow">
              /plugin install agent-tracker
            </Text>
          </Box>

          <Text>
            3. Start a new Claude Code session to begin tracking
          </Text>
        </Box>
      </Box>

      {/* Documentation Link */}
      <Box marginBottom={1}>
        <Text dimColor>
          For more information, see the README at:
        </Text>
      </Box>
      <Box marginLeft={2} marginBottom={1}>
        <Text color="cyan">
          https://github.com/wakeless/agent-tracker
        </Text>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          Press q or Ctrl+C to quit
        </Text>
      </Box>
    </Box>
  );
}
