import React from 'react';
import { Box, Text } from 'ink';
import type { PlanSection as PlanSectionType } from '@agent-tracker/core';

interface PlanSectionProps {
  section: PlanSectionType;
  index: number;
  totalSections: number;
  isSelected: boolean;
  isExpanded: boolean;
}

/**
 * Parse a markdown table into rows and columns.
 */
function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;

  // Check if first line looks like a table header
  const headerLine = lines[0];
  if (!headerLine.includes('|')) return null;

  // Check if second line is a separator (|---|---|)
  const separatorLine = lines[1];
  if (!separatorLine.match(/^\|?[\s-:|]+\|?$/)) return null;

  const parseRow = (line: string): string[] => {
    return line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell, index, arr) => {
        // Filter out empty first/last cells from leading/trailing |
        if (index === 0 && cell === '') return false;
        if (index === arr.length - 1 && cell === '') return false;
        return true;
      });
  };

  const headers = parseRow(headerLine);
  const rows: string[][] = [];

  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].includes('|')) break;
    rows.push(parseRow(lines[i]));
  }

  return { headers, rows };
}

/**
 * Render a table with proper formatting.
 */
function renderTable(
  headers: string[],
  rows: string[][],
  key: number
): React.ReactNode {
  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map((r) => (r[i] || '').length));
    return Math.max(h.length, maxRowWidth, 3);
  });

  const renderRow = (cells: string[], isHeader: boolean, rowKey: string) => (
    <Box key={rowKey}>
      <Text dimColor>│ </Text>
      {cells.map((cell, i) => (
        <React.Fragment key={i}>
          <Text bold={isHeader}>{cell.padEnd(colWidths[i])}</Text>
          <Text dimColor> │ </Text>
        </React.Fragment>
      ))}
    </Box>
  );

  const separator = '─'.repeat(colWidths.reduce((a, b) => a + b + 3, 1));

  return (
    <Box key={key} flexDirection="column" marginY={1}>
      <Text dimColor>┌{separator}┐</Text>
      {renderRow(headers, true, 'header')}
      <Text dimColor>├{separator.replace(/─/g, '─')}┤</Text>
      {rows.map((row, i) => renderRow(row, false, `row-${i}`))}
      <Text dimColor>└{separator}┘</Text>
    </Box>
  );
}

/**
 * Renders content with basic formatting for code blocks and tables.
 */
function renderContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeLines: string[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for code block start/end
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block - render it
        elements.push(
          <Box key={key++} flexDirection="column" marginY={1}>
            <Text dimColor>┌─ {codeBlockLanguage || 'code'} ─────────────────────────────</Text>
            {codeLines.map((codeLine, idx) => (
              <Box key={idx}>
                <Text dimColor>│ </Text>
                <Text wrap="truncate-end">{codeLine}</Text>
              </Box>
            ))}
            <Text dimColor>└─────────────────────────────────────────────</Text>
          </Box>
        );
        inCodeBlock = false;
        codeLines = [];
        codeBlockLanguage = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
      }
      i++;
    } else if (inCodeBlock) {
      codeLines.push(line);
      i++;
    } else if (line.includes('|') && lines[i + 1]?.match(/^\|?[\s-:|]+\|?$/)) {
      // Possible table - collect table lines
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && (lines[j].includes('|') || lines[j].match(/^\|?[\s-:|]+\|?$/))) {
        tableLines.push(lines[j]);
        j++;
      }

      const table = parseTable(tableLines);
      if (table) {
        elements.push(renderTable(table.headers, table.rows, key++));
        i = j;
      } else {
        // Not a valid table, render as regular line
        elements.push(
          <Box key={key++}>
            <Text wrap="wrap">{line}</Text>
          </Box>
        );
        i++;
      }
    } else {
      // Regular line - apply basic formatting

      // Heading (### etc within section)
      if (line.match(/^#{1,6}\s/)) {
        elements.push(
          <Box key={key++}>
            <Text bold wrap="wrap">{line.replace(/^#+\s*/, '')}</Text>
          </Box>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet point
        elements.push(
          <Box key={key++}>
            <Text wrap="wrap">  • {line.slice(2)}</Text>
          </Box>
        );
      } else if (/^\d+\.\s/.test(line)) {
        // Numbered list
        elements.push(
          <Box key={key++}>
            <Text wrap="wrap">  {line}</Text>
          </Box>
        );
      } else if (line.trim() === '') {
        // Empty line
        elements.push(<Box key={key++}><Text> </Text></Box>);
      } else {
        // Regular text
        elements.push(
          <Box key={key++}>
            <Text wrap="wrap">{line}</Text>
          </Box>
        );
      }
      i++;
    }
  }

  return <>{elements}</>;
}

/**
 * Displays a single plan section with collapse/expand support.
 */
export function PlanSection({
  section,
  index,
  totalSections,
  isSelected,
  isExpanded,
}: PlanSectionProps) {
  const indicator = isExpanded ? 'v' : '>';
  const positionLabel = `[${index + 1}/${totalSections}]`;

  return (
    <Box flexDirection="column">
      {/* Section header */}
      <Box>
        {isSelected ? (
          <Text color="cyan" bold>
            {indicator} {section.title}
          </Text>
        ) : (
          <Text>
            <Text dimColor>{indicator} </Text>
            {section.title}
          </Text>
        )}
        <Text dimColor>
          {'  '}
          {positionLabel}
        </Text>
      </Box>

      {/* Section content when expanded */}
      {isExpanded && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {renderContent(section.content)}
        </Box>
      )}
    </Box>
  );
}
