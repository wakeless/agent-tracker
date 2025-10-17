import React from 'react';
import { Box, Text } from 'ink';
import { Session } from '../types/session.js';

interface SessionListProps {
  sessions: Session[];
  selectedIndex: number;
  onSelect?: (index: number) => void;
}

export function SessionList({ sessions, selectedIndex }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>No active sessions</Text>
        <Text dimColor>Start a Claude session to see it here</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1}>
        <Text bold underline>
          Sessions ({sessions.length})
        </Text>
      </Box>
      {sessions.map((session, index) => (
        <SessionListItem
          key={session.id}
          session={session}
          isSelected={index === selectedIndex}
        />
      ))}
    </Box>
  );
}

interface SessionListItemProps {
  session: Session;
  isSelected: boolean;
}

function SessionListItem({ session, isSelected }: SessionListItemProps) {
  const getStatusColor = (status: Session['status']) => {
    if (status === 'active') return 'green';
    if (status === 'inactive') return 'yellow';
    return 'gray';
  };

  const getStatusSymbol = (status: Session['status']) => {
    if (status === 'active') return '●';
    if (status === 'inactive') return '○';
    return '✕';
  };

  // Extract directory name from path
  const dirName = session.cwd.split('/').pop() || session.cwd;

  // Format time since last activity
  const timeSince = formatTimeSince(session.lastActivityTime);

  // Get iTerm-specific information if available
  const isITerm = session.terminal.term_program === 'iTerm.app';
  const tabName =
    isITerm && session.terminal.iterm.tab_name !== 'unknown'
      ? sanitizeDisplayText(session.terminal.iterm.tab_name)
      : null;
  const profile =
    isITerm && session.terminal.iterm.profile !== 'unknown'
      ? session.terminal.iterm.profile
      : null;

  // Build display name with iTerm info
  const displayName = tabName || dirName;

  // Build secondary info line
  const terminalInfo = isITerm
    ? 'iTerm2'
    : session.terminal.term_program || 'Terminal';
  const secondaryInfo = profile
    ? `${terminalInfo} (${profile}) • ${timeSince}`
    : `${terminalInfo} • ${timeSince}`;

  // Build the full display text as a single string so Ink can properly truncate
  const fullDisplayText =
    tabName && tabName !== dirName
      ? `${getStatusSymbol(session.status)} ${displayName} (${dirName})`
      : `${getStatusSymbol(session.status)} ${displayName}`;

  return (
    <Box width="100%">
      <Box width={2} flexShrink={0}>
        {isSelected && (
          <Text bold color="cyan">
            {'> '}
          </Text>
        )}
      </Box>
      <Box flexDirection="column" flexGrow={1} minWidth={0}>
        <Box minWidth={0}>
          <Text
            bold={isSelected}
            color={isSelected ? 'cyan' : getStatusColor(session.status)}
            dimColor={session.status !== 'active'}
            wrap="truncate-end"
          >
            {fullDisplayText}
          </Text>
        </Box>
        <Box marginLeft={2} minWidth={0}>
          <Text dimColor wrap="truncate-end">
            {secondaryInfo}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sanitizeDisplayText(text: string): string {
  // Remove control characters (0x00-0x1F, 0x7F-0x9F)
  // Remove zero-width characters and other invisible Unicode characters
  return text
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // ASCII/Extended control characters
    .replace(/[\u200B-\u200F]/g, "") // Zero-width spaces, joiners, etc.
    .replace(/[\uFEFF]/g, "") // Zero-width no-break space (BOM)
    .replace(/[\u2060-\u206F]/g, "") // Word joiner, invisible operators
    .trim();
}
