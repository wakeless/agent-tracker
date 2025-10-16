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
    <Box flexDirection="column" padding={1}>
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

  return (
    <Box>
      <Box width={2}>
        {isSelected && <Text bold color="cyan">{'> '}</Text>}
      </Box>
      <Box flexDirection="column" flexGrow={1}>
        <Box>
          <Text
            color={getStatusColor(session.status)}
            dimColor={session.status === 'ended'}
          >
            {getStatusSymbol(session.status)}{' '}
          </Text>
          <Text
            bold={isSelected}
            color={isSelected ? 'cyan' : undefined}
            dimColor={session.status !== 'active'}
          >
            {dirName}
          </Text>
        </Box>
        <Box marginLeft={2}>
          <Text dimColor>
            {session.terminal.term_program || 'Terminal'} • {timeSince}
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
