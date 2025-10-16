import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { SessionStore } from './services/SessionStore.js';
import { EventWatcher } from './services/EventWatcher.js';
import { SessionList } from './components/SessionList.js';
import { SessionDetail } from './components/SessionDetail.js';

export function App() {
  const [store] = useState(() => new SessionStore());
  const [watcher] = useState(() => new EventWatcher({
    onSessionStart: (event) => store.handleSessionStart(event),
    onSessionEnd: (event) => store.handleSessionEnd(event),
    onError: (error) => console.error('Event watcher error:', error),
  }));

  const [sessions, setSessions] = useState(store.getSessions());
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  // Update session statuses periodically
  useEffect(() => {
    const interval = setInterval(() => {
      store.updateSessionStatuses();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [store]);

  // Keyboard navigation
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => Math.min(sessions.length - 1, prev + 1));
    } else if (input === 'q' || (key.ctrl && input === 'c')) {
      process.exit(0);
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
          <SessionDetail session={selectedSession} />
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
