import React from 'react';
import { Box, Text } from 'ink';

export interface CodeViewerProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  startLine?: number;
  highlightLines?: number[];
  maxHeight?: number;
}

/**
 * Enhanced code display component with line numbers and borders
 */
export function CodeViewer({
  code,
  language,
  showLineNumbers = true,
  startLine = 1,
  highlightLines = [],
  maxHeight,
}: CodeViewerProps) {
  const lines = code.split('\n');
  const highlightSet = new Set(highlightLines);

  // Calculate line number width for padding
  const maxLineNum = startLine + lines.length - 1;
  const lineNumWidth = String(maxLineNum).length;

  // Determine if we need to truncate
  const shouldTruncate = maxHeight !== undefined && lines.length > maxHeight;
  const displayLines = shouldTruncate ? lines.slice(0, maxHeight) : lines;
  const hiddenCount = shouldTruncate ? lines.length - maxHeight : 0;

  // Build header
  const headerLabel = language || 'code';
  const headerLine = `─ ${headerLabel} `;
  const headerPadding = '─'.repeat(Math.max(0, 40 - headerLine.length));

  return (
    <Box flexDirection="column">
      {/* Top border with language label */}
      <Box>
        <Text dimColor>┌{headerLine}{headerPadding}┐</Text>
      </Box>

      {/* Code lines */}
      {displayLines.map((line, idx) => {
        const lineNum = startLine + idx;
        const isHighlighted = highlightSet.has(lineNum);

        return (
          <Box key={idx}>
            <Text dimColor>│ </Text>
            {showLineNumbers && (
              <Text dimColor={!isHighlighted} color={isHighlighted ? 'yellow' : undefined}>
                {String(lineNum).padStart(lineNumWidth, ' ')}
              </Text>
            )}
            {showLineNumbers && <Text dimColor> │ </Text>}
            <Text color={isHighlighted ? 'yellow' : undefined}>
              {line || ' '}
            </Text>
          </Box>
        );
      })}

      {/* Truncation indicator */}
      {shouldTruncate && (
        <Box>
          <Text dimColor>│ </Text>
          <Text color="yellow">
            ... {hiddenCount} more line{hiddenCount !== 1 ? 's' : ''} (scroll in detail view)
          </Text>
        </Box>
      )}

      {/* Bottom border */}
      <Box>
        <Text dimColor>└{'─'.repeat(Math.max(0, headerLine.length + headerPadding.length))}┘</Text>
      </Box>
    </Box>
  );
}
