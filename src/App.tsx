import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ActivityStore } from './services/ActivityStore.js';
import { EventWatcher } from './services/EventWatcher.js';
import { SessionList } from './components/SessionList.js';
import { SessionDetail } from './components/SessionDetail.js';
import { TranscriptViewer } from './components/TranscriptViewer.js';
import { ToolDetailView } from './components/ToolDetailView.js';
import { EmptyState } from './components/EmptyState.js';
import { TranscriptReader } from './services/TranscriptReader.js';
import { actions } from './types/actions.js';
import { ParsedTranscriptEntry } from './types/transcript.js';

type ViewMode = 'list' | 'transcript' | 'tool-detail';

export interface AppProps {
  eventsFilePath?: string;
}

export function App({ eventsFilePath }: AppProps = {}) {
  const [store] = useState(() => new ActivityStore({ enableLogging: false }));
  const [watcher] = useState(() => new EventWatcher({
    onSessionStart: (event) => store.dispatch(actions.sessionStart(event)),
    onSessionEnd: (event) => store.dispatch(actions.sessionEnd(event)),
    onActivity: (event) => {
      // Dispatch specific activity action based on activity_type
      switch (event.activity_type) {
        case 'tool_use':
          store.dispatch(actions.activityToolUse(event));
          break;
        case 'prompt_submit':
          store.dispatch(actions.activityPromptSubmit(event));
          break;
        case 'stop':
          store.dispatch(actions.activityStop(event));
          break;
        case 'subagent_stop':
          store.dispatch(actions.activitySubagentStop(event));
          break;
        case 'notification':
          store.dispatch(actions.activityNotification(event));
          break;
      }
    },
    onError: (error) => console.error('Event watcher error:', error),
  }, eventsFilePath ? { logPath: eventsFilePath } : undefined));

  const [sessions, setSessions] = useState(store.getSessions());
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [recentTranscript, setRecentTranscript] = useState<ParsedTranscriptEntry[]>([]);
  const [selectedToolEntry, setSelectedToolEntry] = useState<ParsedTranscriptEntry | null>(null);
  const [allTranscriptEntries, setAllTranscriptEntries] = useState<ParsedTranscriptEntry[]>([]);

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSessions(store.getSessions());
    });
    return unsubscribe;
  }, [store]);

  // Check if events file exists - if not, show empty state
  const eventsFileExists = watcher.fileExists();

  // Start watching for events (only if file exists)
  useEffect(() => {
    if (eventsFileExists) {
      watcher.start();
      return () => watcher.stop();
    }
  }, [watcher, eventsFileExists]);

  // Update session activity from transcript files periodically
  useEffect(() => {
    const updateTranscriptActivity = async () => {
      const currentSessions = store.getSessions();
      const reader = new TranscriptReader();

      for (const session of currentSessions) {
        // Skip ended sessions
        if (session.status === 'ended') continue;

        try {
          const lastTimestamp = await reader.getLastEntryTimestamp(session.transcriptPath);
          if (lastTimestamp) {
            store.updateSessionActivityFromTranscript(session.id, lastTimestamp);
          }
        } catch (error) {
          // Transcript file might not exist or be inaccessible
          // Skip this session
        }
      }
    };

    // Run immediately on mount
    updateTranscriptActivity();

    // Then run every 15 seconds
    const interval = setInterval(updateTranscriptActivity, 15000);

    return () => clearInterval(interval);
  }, [store]);

  // Update session statuses periodically
  useEffect(() => {
    // Run immediately on mount to clean up stale sessions
    store.updateSessionStatuses();

    // Then run every 10 seconds
    const interval = setInterval(() => {
      store.updateSessionStatuses();
    }, 10000);

    return () => clearInterval(interval);
  }, [store]);

  // Initialize or update selected session ID
  useEffect(() => {
    // If no selection and sessions exist, select first
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
      return;
    }

    // If selected session no longer exists, select first available or null
    if (selectedSessionId && !sessions.find((s) => s.id === selectedSessionId)) {
      setSelectedSessionId(sessions[0]?.id || null);
    }
  }, [sessions, selectedSessionId]);

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
  }, [selectedSessionId, sessions]);

  // Keyboard navigation
  useInput((input, key) => {
    if (viewMode === 'tool-detail') {
      // In tool detail view, ESC returns to transcript
      if (key.escape) {
        setViewMode('transcript');
        setSelectedToolEntry(null);
      } else if (input === 'q' || (key.ctrl && input === 'c')) {
        process.exit(0);
      }
    } else if (viewMode === 'transcript') {
      // In transcript view, ESC returns to list
      // Enter is handled by TranscriptViewer to show tool details
      if (key.escape) {
        setViewMode('list');
      } else if (input === 'q' || (key.ctrl && input === 'c')) {
        process.exit(0);
      }
    } else {
      // In list view
      if (key.upArrow || input === 'k') {
        // Navigate to previous session
        const currentIdx = sessions.findIndex((s) => s.id === selectedSessionId);
        if (currentIdx > 0) {
          setSelectedSessionId(sessions[currentIdx - 1].id);
        }
      } else if (key.downArrow || input === 'j') {
        // Navigate to next session
        const currentIdx = sessions.findIndex((s) => s.id === selectedSessionId);
        if (currentIdx >= 0 && currentIdx < sessions.length - 1) {
          setSelectedSessionId(sessions[currentIdx + 1].id);
        }
      } else if (key.return && sessions.find((s) => s.id === selectedSessionId)) {
        // Press Enter to view transcript
        setViewMode('transcript');
      } else if (input === 'q' || (key.ctrl && input === 'c')) {
        process.exit(0);
      }
    }
  });

  // Derive selected session from ID
  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
  const counts = store.getSessionCounts();

  // Handler for showing tool detail view
  const handleShowToolDetail = (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => {
    setSelectedToolEntry(toolEntry);
    setAllTranscriptEntries(allEntries);
    setViewMode('tool-detail');
  };

  // If events file doesn't exist, show empty state
  if (!eventsFileExists) {
    return <EmptyState />;
  }

  // Tool detail view
  if (viewMode === 'tool-detail' && selectedToolEntry) {
    // Find the corresponding tool_result entry
    const toolResultEntry = allTranscriptEntries.find(
      entry => entry.type === 'tool_result' && entry.toolUseId === selectedToolEntry.toolId
    ) || null;

    return (
      <ToolDetailView
        toolUseEntry={selectedToolEntry}
        toolResultEntry={toolResultEntry}
        onBack={() => {
          setViewMode('transcript');
          setSelectedToolEntry(null);
        }}
      />
    );
  }

  // Transcript view
  if (viewMode === 'transcript' && selectedSession) {
    return (
      <TranscriptViewer
        key={selectedSession.id}
        transcriptPath={selectedSession.transcriptPath}
        sessionId={selectedSession.id}
        onShowToolDetail={handleShowToolDetail}
      />
    );
  }

  // List view
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
            <Text bold color="magenta">{counts.awaitingInput}</Text>
          </Box>
        )}
        <Box marginRight={2}>
          <Text color="green">Active: </Text>
          <Text bold color="green">{counts.active}</Text>
        </Box>
        <Box marginRight={2}>
          <Text color="yellow">Inactive: </Text>
          <Text bold color="yellow">{counts.inactive}</Text>
        </Box>
        <Box>
          <Text color="red">Ended: </Text>
          <Text bold color="red">{counts.ended}</Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box borderStyle="round" borderColor="gray">
        {/* Left Panel - Session List */}
        <Box flexGrow={1} borderStyle="single" borderColor="gray">
          <SessionList
            sessions={sessions}
            selectedSessionId={selectedSessionId}
          />
        </Box>

        {/* Right Panel - Session Detail */}
        <Box flexGrow={2}>
          <SessionDetail session={selectedSession} recentTranscript={recentTranscript} />
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          Navigation: ↑/↓ or j/k • Quit: q or Ctrl+C • Log: {watcher.getLogPath()}
        </Text>
      </Box>
    </Box>
  );
}
