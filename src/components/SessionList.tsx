import React from 'react';
import { Box, Text } from 'ink';
import { Session } from '../types/session.js';
import { getStableColor } from '../utils/stableColors.js';

interface SessionListProps {
  sessions: Session[];
  selectedSessionId: string | null;
}

export function SessionList({ sessions, selectedSessionId }: SessionListProps) {
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
      {sessions.map((session) => (
        <SessionListItem
          key={session.id}
          session={session}
          isSelected={session.id === selectedSessionId}
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
  const getStatusColor = (status: Session['status'], awaitingInput: boolean) => {
    if (awaitingInput) return 'magenta';
    if (status === 'active') return 'green';
    if (status === 'inactive') return 'yellow';
    return 'gray';
  };

  const getStatusSymbol = (status: Session['status'], awaitingInput: boolean) => {
    if (awaitingInput) return '⏳';
    if (status === 'active') return '●';
    if (status === 'inactive') return '○';
    return '✕';
  };

  // Extract directory name from path
  const dirName = session.cwd.split('/').pop() || session.cwd;

  // Build project identifier from git info
  const getProjectParts = (): { repoName: string; branch: string | null } => {
    if (session.git.is_repo && session.git.repo_name !== 'unknown') {
      return {
        repoName: session.git.repo_name,
        branch: session.git.branch,
      };
    }
    // Fall back to directory name for non-git projects
    return {
      repoName: dirName,
      branch: null,
    };
  };

  // Format time since last activity
  const timeSince = formatTimeSince(session.lastActivityTime);

  // Get iTerm-specific information if available
  const isITerm = session.terminal.term_program === 'iTerm.app';
  const tabName =
    isITerm && session.terminal.iterm.tab_name !== 'unknown'
      ? sanitizeDisplayText(session.terminal.iterm.tab_name)
      : null;

  // Get project parts for stable coloring
  const { repoName, branch } = getProjectParts();

  // Get stable colors for repo and branch (background + foreground)
  const repoColors = getStableColor(repoName);
  const branchColors = branch ? getStableColor(branch) : null;

  // Simplified secondary info: just show time since last activity
  const secondaryInfo = timeSince;

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
          {/* Status symbol */}
          <Text
            key="status"
            bold={isSelected}
            color={isSelected ? 'cyan' : getStatusColor(session.status, session.awaitingInput)}
            dimColor={session.status !== 'active' && !session.awaitingInput}
          >
            {getStatusSymbol(session.status, session.awaitingInput)}{' '}
          </Text>

          {/* Repo name with stable background color */}
          <Text
            key="repo"
            bold={isSelected}
            backgroundColor={isSelected ? undefined : repoColors.backgroundColor}
            color={isSelected ? 'cyan' : repoColors.foregroundColor}
          >
            {isSelected ? repoName : ` ${repoName} `}
          </Text>

          {/* Branch with stable background color (if git repo) */}
          {branch && branchColors && (
            <React.Fragment key="branch-fragment">
              <Text key="branch-colon" bold={isSelected} dimColor>:</Text>
              <Text
                key="branch-name"
                bold={isSelected}
                backgroundColor={isSelected ? undefined : branchColors.backgroundColor}
                color={isSelected ? 'cyan' : branchColors.foregroundColor}
              >
                {isSelected ? branch : ` ${branch} `}
              </Text>
            </React.Fragment>
          )}

          {/* Tab name (if available) */}
          {tabName && (
            <React.Fragment key="tab-fragment">
              <Text key="tab-separator" dimColor> – </Text>
              <Text key="tab-name" dimColor>{tabName}</Text>
            </React.Fragment>
          )}
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
