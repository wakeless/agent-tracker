import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Session } from '../types/session.js';
import { SessionList } from './SessionList.js';
import { SessionDetail } from './SessionDetail.js';
import { TranscriptReader } from '../services/TranscriptReader.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';
import { SessionTrackerService } from '../services/SessionTrackerService.js';

interface SessionListViewProps {
  sessions: Session[];
  selectedSessionId: string | null;
  service: SessionTrackerService;
  onSelectSession: (sessionId: string | null) => void;
  onViewTranscript: (sessionId: string) => void;
}

export function SessionListView({
  sessions,
  selectedSessionId,
  service,
  onSelectSession,
  onViewTranscript,
}: SessionListViewProps) {
  const [recentTranscript, setRecentTranscript] = useState<ParsedTranscriptEntry[]>([]);

  // Load recent transcript entries for selected session
  useEffect(() => {
    const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
    if (!selectedSession) {
      setRecentTranscript([]);
      return;
    }

    const loadRecentTranscript = async () => {
      try {
        const reader = new TranscriptReader();
        const entries = await reader.getRecentEntries(selectedSession.transcriptPath, 5);
        setRecentTranscript(entries);
      } catch (error) {
        // Transcript file might not exist yet or be inaccessible
        setRecentTranscript([]);
      }
    };

    loadRecentTranscript();
    // Only depend on selectedSessionId - sessions array reference changes on every re-sort
    // but we don't need to reload transcript when that happens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  // Keyboard navigation for session list
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      // Navigate to previous session
      const currentIdx = sessions.findIndex((s) => s.id === selectedSessionId);
      if (currentIdx > 0) {
        onSelectSession(sessions[currentIdx - 1].id);
      }
    } else if (key.downArrow || input === 'j') {
      // Navigate to next session
      const currentIdx = sessions.findIndex((s) => s.id === selectedSessionId);
      if (currentIdx >= 0 && currentIdx < sessions.length - 1) {
        onSelectSession(sessions[currentIdx + 1].id);
      }
    } else if (key.return && selectedSessionId) {
      // Press Enter to view transcript
      onViewTranscript(selectedSessionId);
    }
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
  const counts = service.getSessionCounts();

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Agent Tracker
        </Text>
        <Text dimColor> - Tracking Claude Code Sessions</Text>
      </Box>

      {/* Stats Bar */}
      <Box marginBottom={1}>
        <Box marginRight={2}>
          <Text>Total: </Text>
          <Text bold>{counts.total}</Text>
        </Box>
        {counts.awaitingInput > 0 && (
          <Box marginRight={2}>
            <Text color="magenta">⏳ Awaiting Input: </Text>
            <Text bold color="magenta">
              {counts.awaitingInput}
            </Text>
          </Box>
        )}
        <Box marginRight={2}>
          <Text color="green">Active: </Text>
          <Text bold color="green">
            {counts.active}
          </Text>
        </Box>
        <Box marginRight={2}>
          <Text color="yellow">Inactive: </Text>
          <Text bold color="yellow">
            {counts.inactive}
          </Text>
        </Box>
        <Box>
          <Text color="red">Ended: </Text>
          <Text bold color="red">
            {counts.ended}
          </Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box borderStyle="round" borderColor="gray">
        {/* Left Panel - Session List */}
        <Box flexGrow={1} borderStyle="single" borderColor="gray">
          <SessionList sessions={sessions} selectedSessionId={selectedSessionId} />
        </Box>

        {/* Right Panel - Session Detail */}
        <Box flexGrow={2}>
          <SessionDetail session={selectedSession} recentTranscript={recentTranscript} />
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>Navigation: ↑/↓ or j/k • Enter: View transcript • Quit: q or Ctrl+C</Text>
      </Box>
    </Box>
  );
}
