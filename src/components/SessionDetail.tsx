import React from 'react';
import { Box, Text } from 'ink';
import { Session } from '../types/session.js';

interface SessionDetailProps {
  session: Session | null;
}

export function SessionDetail({ session }: SessionDetailProps) {
  if (!session) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text dimColor>No session selected</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>
          Session Details
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>Status: </Text>
        <StatusBadge status={session.status} />
      </Box>

      <DetailRow label="Session ID" value={session.id} />
      <DetailRow label="Working Directory" value={session.cwd} />

      <Box marginTop={1} marginBottom={1}>
        <Text bold underline>Terminal Information</Text>
      </Box>

      <DetailRow label="Program" value={session.terminal.term_program} />
      <DetailRow label="TTY" value={session.terminal.tty} />
      <DetailRow label="Shell" value={session.terminal.shell} />
      <DetailRow label="TERM" value={session.terminal.term} />

      <Box marginTop={1} marginBottom={1}>
        <Text bold underline>Timestamps</Text>
      </Box>

      <DetailRow label="Started" value={formatDateTime(session.startTime)} />
      <DetailRow label="Last Activity" value={formatDateTime(session.lastActivityTime)} />
      {session.endTime && (
        <DetailRow label="Ended" value={formatDateTime(session.endTime)} />
      )}

      <Box marginTop={1}>
        <Text bold>Transcript: </Text>
        <Text dimColor>{session.transcriptPath}</Text>
      </Box>
    </Box>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Box>
      <Box width={20}>
        <Text dimColor>{label}:</Text>
      </Box>
      <Text>{value}</Text>
    </Box>
  );
}

interface StatusBadgeProps {
  status: Session['status'];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const getColor = () => {
    if (status === 'active') return 'green';
    if (status === 'inactive') return 'yellow';
    return 'red';
  };

  const getSymbol = () => {
    if (status === 'active') return '● Active';
    if (status === 'inactive') return '○ Inactive';
    return '✕ Ended';
  };

  return (
    <Text bold color={getColor()}>
      {getSymbol()}
    </Text>
  );
}

function formatDateTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  // If today, show time
  if (date.toDateString() === now.toDateString()) {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (diffSeconds < 60) {
      return `${timeStr} (${diffSeconds}s ago)`;
    } else if (diffMinutes < 60) {
      return `${timeStr} (${diffMinutes}m ago)`;
    } else {
      return `${timeStr} (${diffHours}h ago)`;
    }
  }

  // Otherwise show date and time
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
