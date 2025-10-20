import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInput } from 'ink';
import { SessionTrackerService } from './services/SessionTrackerService.js';
import { useSessionTracker } from './hooks/useSessionTracker.js';
import { SessionListView } from './components/SessionListView.js';
import { TranscriptViewer } from './components/TranscriptViewer.js';
import { ToolDetailView } from './components/ToolDetailView.js';
import { EmptyState } from './components/EmptyState.js';
import { TranscriptReader } from './services/TranscriptReader.js';
import { useNavigation, NavStackItem } from './hooks/useNavigation.js';
import { ParsedTranscriptEntry } from './types/transcript.js';
import { homedir } from 'os';
import { join } from 'path';

export interface AppProps {
  eventsFilePath?: string;
}

export function App({ eventsFilePath }: AppProps = {}) {
  // Create SessionTrackerService instance once using useRef for stability
  // This ensures the service instance is the same across all re-renders
  const serviceRef = useRef<SessionTrackerService | null>(null);
  if (!serviceRef.current) {
    // Default to ~/.agent-tracker/sessions.jsonl if not specified
    const defaultPath = join(homedir(), '.agent-tracker', 'sessions.jsonl');
    serviceRef.current = new SessionTrackerService({
      eventsFilePath: eventsFilePath || defaultPath,
      enableLogging: false,
    });
  }
  const service = serviceRef.current;

  // Use the hook to subscribe to session updates
  const { sessions } = useSessionTracker(service);

  // Navigation stack
  const navigation = useNavigation(sessions[0]?.id || null);

  // Check if events file exists - if not, show empty state
  const eventsFileExists = service.fileExists();

  // Start watching for events (only if file exists)
  useEffect(() => {
    if (eventsFileExists) {
      service.start();
      return () => service.stop();
    }
  }, [service, eventsFileExists]);

  // Update session activity from transcript files periodically
  useEffect(() => {
    const updateTranscriptActivity = async () => {
      const currentSessions = service.getSessions();
      const reader = new TranscriptReader();

      for (const session of currentSessions) {
        // Skip ended sessions
        if (session.status === 'ended') continue;

        try {
          const lastTimestamp = await reader.getLastEntryTimestamp(session.transcriptPath);
          if (lastTimestamp) {
            service.updateSessionActivityFromTranscript(session.id, lastTimestamp);
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
  }, [service]);

  // Update session statuses periodically
  useEffect(() => {
    // Run immediately on mount to clean up stale sessions
    service.updateSessionStatuses();

    // Then run every 10 seconds
    const interval = setInterval(() => {
      service.updateSessionStatuses();
    }, 10000);

    return () => clearInterval(interval);
  }, [service]);

  // No effect needed - selection is managed by:
  // 1. Initial navigation state (useNavigation hook)
  // 2. User navigation (j/k/Enter in SessionListView)
  // 3. Deleted session handling (at render time below)

  // Global keyboard navigation - only ESC (pop) and quit
  // Component-specific navigation (j/k/Enter) is handled by each view
  useInput((input, key) => {
    if (key.escape && navigation.depth > 1) {
      // Pop back one level (but not from list view)
      navigation.pop();
    } else if (input === 'q' || (key.ctrl && input === 'c')) {
      process.exit(0);
    }
  });

  // If events file doesn't exist, show empty state
  if (!eventsFileExists) {
    return <EmptyState />;
  }

  // Prepare data before rendering (avoid hooks in switch)
  const currentView = navigation.currentView;

  // For transcript view: memoize session and callback
  const transcriptSession = currentView.type === 'transcript'
    ? sessions.find((s) => s.id === currentView.sessionId)
    : null;

  const stableTranscriptSession = useMemo(
    () => transcriptSession,
    [transcriptSession?.id, transcriptSession?.transcriptPath]
  );

  const handleShowToolDetail = useCallback(
    (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => {
      if (transcriptSession) {
        navigation.pushToolDetail(transcriptSession.id, toolEntry.uuid, allEntries);
      }
    },
    [navigation, transcriptSession?.id]
  );

  // Render based on current view in navigation stack
  switch (currentView.type) {
    case 'list': {
      // Handle case where selected session was deleted
      const selectedSessionId = currentView.selectedSessionId;
      const selectedSessionExists = selectedSessionId
        ? sessions.some(s => s.id === selectedSessionId)
        : false;

      // If selected session doesn't exist but we have sessions, select first
      if (!selectedSessionExists && sessions.length > 0) {
        navigation.selectSession(sessions[0].id);
      }

      return (
        <SessionListView
          sessions={sessions}
          selectedSessionId={selectedSessionExists ? selectedSessionId : (sessions[0]?.id || null)}
          service={service}
          onSelectSession={navigation.selectSession}
          onViewTranscript={navigation.pushTranscript}
        />
      );
    }

    case 'transcript': {
      if (!stableTranscriptSession) {
        // Session was deleted, pop back to list
        navigation.pop();
        return null;
      }

      const transcriptView = currentView as Extract<NavStackItem, { type: 'transcript' }>;

      return (
        <TranscriptViewer
          key={stableTranscriptSession.id}
          transcriptPath={stableTranscriptSession.transcriptPath}
          sessionId={stableTranscriptSession.id}
          session={stableTranscriptSession}
          onShowToolDetail={handleShowToolDetail}
          initialSelectedUuid={transcriptView.selectedUuid}
          onSelectionChange={navigation.updateTranscriptPosition}
        />
      );
    }

    case 'tool-detail': {
      // Type assertion since we're in the tool-detail case
      const toolDetailView = currentView as Extract<NavStackItem, { type: 'tool-detail' }>;
      const session = sessions.find((s) => s.id === toolDetailView.sessionId);
      const toolUseEntry = toolDetailView.allTranscriptEntries.find(
        (e) => e.uuid === toolDetailView.toolEntryUuid
      );
      const toolResultEntry =
        toolDetailView.allTranscriptEntries.find(
          (e) => e.type === 'tool_result' && e.toolUseId === toolUseEntry?.toolId
        ) || null;

      if (!session || !toolUseEntry) {
        // Data no longer valid, pop back
        navigation.pop();
        return null;
      }

      return <ToolDetailView toolUseEntry={toolUseEntry} toolResultEntry={toolResultEntry} />;
    }

    default:
      // Should never happen due to TypeScript exhaustiveness checking
      return null;
  }
}
