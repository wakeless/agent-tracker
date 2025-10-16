import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ActivityStore } from './services/ActivityStore.js';
import { EventWatcher } from './services/EventWatcher.js';
import { SessionList } from './components/SessionList.js';
import { SessionDetail } from './components/SessionDetail.js';
import { TranscriptViewer } from './components/TranscriptViewer.js';
import { ToolDetailView } from './components/ToolDetailView.js';
import { TranscriptReader } from './services/TranscriptReader.js';
import { actions } from './types/actions.js';
import { ParsedTranscriptEntry } from './types/transcript.js';

type ViewMode = 'list' | 'transcript' | 'tool-detail';

export function App() {
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
  }));

  const [sessions, setSessions] = useState(store.getSessions());
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  // Start watching for events
  useEffect(() => {
    watcher.start();
    return () => watcher.stop();
  }, [watcher]);

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
    const interval = setInterval(() => {
      store.updateSessionStatuses();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [store]);

  // Load recent transcript entries for selected session
  useEffect(() => {
    const selectedSession = sessions[selectedIndex] || null;
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
  }, [selectedIndex, sessions]);

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
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow || input === 'j') {
        setSelectedIndex((prev) => Math.min(sessions.length - 1, prev + 1));
      } else if (key.return && selectedSession) {
        // Press Enter to view transcript
        setViewMode('transcript');
      } else if (input === 'q' || (key.ctrl && input === 'c')) {
        process.exit(0);
      }
    }
  });

  // Keep selected index in bounds
  useEffect(() => {
    if (selectedIndex >= sessions.length && sessions.length > 0) {
      setSelectedIndex(sessions.length - 1);
    }
  }, [sessions.length, selectedIndex]);

  const selectedSession = sessions[selectedIndex] || null;
  const counts = store.getSessionCounts();

  // Handler for showing tool detail view
  const handleShowToolDetail = (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => {
    setSelectedToolEntry(toolEntry);
    setAllTranscriptEntries(allEntries);
    setViewMode('tool-detail');
  };

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
        <Box width="50%" borderStyle="single" borderColor="gray">
          <SessionList
            sessions={sessions}
            selectedIndex={selectedIndex}
          />
        </Box>

        {/* Right Panel - Session Detail */}
        <Box width="50%">
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
