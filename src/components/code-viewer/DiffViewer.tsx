import React from 'react';
import { Box, Text } from 'ink';
import { computeDiff, filterDiffWithContext, DiffLine } from './computeDiff.js';

export interface DiffViewerProps {
  oldText: string;
  newText: string;
  oldLabel?: string;
  newLabel?: string;
  contextLines?: number;
  showAllLines?: boolean;
}

/**
 * Unified diff display component with colored additions/removals
 */
export function DiffViewer({
  oldText,
  newText,
  oldLabel = 'before',
  newLabel = 'after',
  contextLines = 3,
  showAllLines = false,
}: DiffViewerProps) {
  // Compute the diff
  const fullDiff = computeDiff(oldText, newText);

  // Filter to show only relevant context unless showing all
  const displayDiff = showAllLines ? fullDiff : filterDiffWithContext(fullDiff, contextLines);

  // Calculate statistics
  const additions = fullDiff.filter(l => l.type === 'add').length;
  const removals = fullDiff.filter(l => l.type === 'remove').length;

  // Calculate line number widths
  const maxOldLineNum = Math.max(...fullDiff.filter(l => l.oldLineNumber).map(l => l.oldLineNumber!), 1);
  const maxNewLineNum = Math.max(...fullDiff.filter(l => l.newLineNumber).map(l => l.newLineNumber!), 1);
  const oldLineNumWidth = String(maxOldLineNum).length;
  const newLineNumWidth = String(maxNewLineNum).length;

  // Build header
  const headerLabel = 'diff';
  const headerLine = `─ ${headerLabel} `;
  const headerPadding = '─'.repeat(Math.max(0, 45 - headerLine.length));

  return (
    <Box flexDirection="column">
      {/* Top border with diff label */}
      <Box>
        <Text dimColor>┌{headerLine}{headerPadding}┐</Text>
      </Box>

      {/* Stats line */}
      <Box>
        <Text dimColor>│ </Text>
        <Text color="green">+{additions}</Text>
        <Text dimColor> / </Text>
        <Text color="red">-{removals}</Text>
        <Text dimColor> ({oldLabel} → {newLabel})</Text>
      </Box>

      {/* Separator */}
      <Box>
        <Text dimColor>├{'─'.repeat(Math.max(0, headerLine.length + headerPadding.length))}┤</Text>
      </Box>

      {/* Diff lines */}
      {displayDiff.length === 0 ? (
        <Box>
          <Text dimColor>│ No changes</Text>
        </Box>
      ) : (
        displayDiff.map((diffLine, idx) => (
          <DiffLineComponent
            key={idx}
            diffLine={diffLine}
            oldLineNumWidth={oldLineNumWidth}
            newLineNumWidth={newLineNumWidth}
          />
        ))
      )}

      {/* Bottom border */}
      <Box>
        <Text dimColor>└{'─'.repeat(Math.max(0, headerLine.length + headerPadding.length))}┘</Text>
      </Box>
    </Box>
  );
}

interface DiffLineComponentProps {
  diffLine: DiffLine;
  oldLineNumWidth: number;
  newLineNumWidth: number;
}

function DiffLineComponent({ diffLine, oldLineNumWidth, newLineNumWidth }: DiffLineComponentProps) {
  const { type, line, oldLineNumber, newLineNumber } = diffLine;

  // Handle separator
  if (line === '...') {
    return (
      <Box>
        <Text dimColor>│ {'─'.repeat(oldLineNumWidth + newLineNumWidth + 7)}</Text>
      </Box>
    );
  }

  // Format line numbers
  const oldNum = oldLineNumber !== undefined ? String(oldLineNumber).padStart(oldLineNumWidth, ' ') : ' '.repeat(oldLineNumWidth);
  const newNum = newLineNumber !== undefined ? String(newLineNumber).padStart(newLineNumWidth, ' ') : ' '.repeat(newLineNumWidth);

  // Determine colors and indicator
  let indicator: string;
  let lineColor: string | undefined;
  let indicatorColor: string;

  switch (type) {
    case 'add':
      indicator = '+';
      lineColor = 'green';
      indicatorColor = 'green';
      break;
    case 'remove':
      indicator = '-';
      lineColor = 'red';
      indicatorColor = 'red';
      break;
    case 'context':
    default:
      indicator = ' ';
      lineColor = undefined;
      indicatorColor = 'gray';
      break;
  }

  return (
    <Box>
      <Text dimColor>│ </Text>
      <Text dimColor>{oldNum}</Text>
      <Text dimColor> </Text>
      <Text dimColor>{newNum}</Text>
      <Text dimColor> </Text>
      <Text color={indicatorColor as any}>{indicator}</Text>
      <Text dimColor> </Text>
      <Text color={lineColor as any}>{line || ' '}</Text>
    </Box>
  );
}
