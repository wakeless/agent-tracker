import React from 'react';
import { Box, Text } from 'ink';
import { Session } from '../types/session.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';

interface SessionDetailProps {
  session: Session | null;
  recentTranscript?: ParsedTranscriptEntry[];
}

export function SessionDetail({ session, recentTranscript = [] }: SessionDetailProps) {
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

      {/* iTerm2-specific information */}
      {session.terminal.term_program === 'iTerm.app' && (
        <React.Fragment>
          {session.terminal.iterm.tab_name !== 'unknown' && (
            <DetailRow label="iTerm Tab" value={session.terminal.iterm.tab_name} />
          )}
          {session.terminal.iterm.window_name !== 'unknown' && (
            <DetailRow label="iTerm Window" value={session.terminal.iterm.window_name} />
          )}
          {session.terminal.iterm.profile !== 'unknown' && (
            <DetailRow label="iTerm Profile" value={session.terminal.iterm.profile} />
          )}
          {session.terminal.iterm.session_id !== 'unknown' && (
            <DetailRow label="iTerm Session ID" value={session.terminal.iterm.session_id} />
          )}
        </React.Fragment>
      )}

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

      {/* Recent Conversation Section */}
      {recentTranscript.length > 0 && (
        <React.Fragment>
          <Box marginTop={1} marginBottom={1}>
            <Text bold underline>Recent Conversation</Text>
          </Box>
          {recentTranscript.slice(-5).map((entry, index) => {
            const maxLength = 60;
            const truncatedContent = entry.content.length > maxLength
              ? entry.content.substring(0, maxLength) + '...'
              : entry.content;

            const typeColor = entry.type === 'user' ? 'cyan' : entry.type === 'tool_use' ? 'yellow' : 'green';
            const typeLabel = entry.type === 'user' ? 'User' : entry.type === 'tool_use' ? entry.toolName || 'Tool' : 'Assistant';

            return (
              <Box key={entry.uuid} flexDirection="column" marginBottom={index === 4 ? 0 : 1}>
                <Box>
                  <Text dimColor>{formatActivityTime(entry.timestamp)}</Text>
                  <Text> </Text>
                  <Text bold color={typeColor}>[{typeLabel}]</Text>
                </Box>
                <Box marginLeft={2}>
                  <Text>{truncatedContent}</Text>
                </Box>
              </Box>
            );
          })}
        </React.Fragment>
      )}

      <Box marginTop={1}>
        <Text bold>Transcript: </Text>
        <Text dimColor>{session.transcriptPath}</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press ENTER to view full transcript</Text>
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
      <Box width={22}>
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

function formatActivityTime(date: Date): string {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}
