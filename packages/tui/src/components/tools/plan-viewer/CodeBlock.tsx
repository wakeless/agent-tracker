import React from 'react';
import { Box, Text } from 'ink';

interface CodeBlockProps {
  language: string;
  code: string;
}

/**
 * Displays a code block with language label and border.
 */
export function CodeBlock({ language, code }: CodeBlockProps) {
  const displayLanguage = language || 'text';

  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        <Text dimColor>{'┌─ '}</Text>
        <Text color="cyan">{displayLanguage}</Text>
        <Text dimColor>{' ─────────────────────────────────────────'}</Text>
      </Box>
      <Box flexDirection="column" paddingLeft={1}>
        {code.split('\n').map((line, i) => (
          <Box key={i}>
            <Text dimColor>│ </Text>
            <Text>{line}</Text>
          </Box>
        ))}
      </Box>
      <Box>
        <Text dimColor>{'└─────────────────────────────────────────────────'}</Text>
      </Box>
    </Box>
  );
}
