import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Box, Text, useInput } from 'ink';
import { TranscriptReader } from '../services/TranscriptReader.js';
import { TranscriptWatcher } from '../services/TranscriptWatcher.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';
import { Session } from '../types/session.js';
import { MarkdownText } from './MarkdownText.js';
import { ToolDisplay } from './tools/index.js';
import {
  transcriptReducer,
  initialState,
  getFilteredEntries,
  getVisibleEntriesFromState,
  getNewEntriesCount,
} from '../reducers/transcriptReducer.js';

interface TranscriptViewerProps {
  transcriptPath: string;
  sessionId: string;
  session: Session;
  onShowToolDetail?: (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => void;
  initialSelectedUuid?: string; // Restore scroll position from navigation stack
  onSelectionChange?: (selectedUuid: string) => void; // Save scroll position to navigation stack
}

export function TranscriptViewer({
  transcriptPath,
  sessionId,
  session,
  onShowToolDetail,
  initialSelectedUuid,
  onSelectionChange
}: TranscriptViewerProps) {
  const [state, dispatch] = useReducer(transcriptReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watcherRef = useRef<TranscriptWatcher | null>(null);
  const lastTranscriptPathRef = useRef<string>('');

  // Derive computed values from state
  const filteredEntries = getFilteredEntries(state);
  const visibleEntries = getVisibleEntriesFromState(state);
  const newEntriesCount = getNewEntriesCount(state);

  useEffect(() => {
    // Skip reload if this is the same transcript path (component re-rendered but transcript didn't change)
    if (lastTranscriptPathRef.current === transcriptPath) {
      return;
    }

    const loadTranscript = async () => {
      try {
        setLoading(true);
        setError(null);
        const reader = new TranscriptReader();
        const parsedEntries = await reader.readTranscript(transcriptPath);
        dispatch({
          type: 'LOAD_TRANSCRIPT',
          entries: parsedEntries,
          initialSelectedUuid: initialSelectedUuid // Restore scroll position if provided
        });
        lastTranscriptPathRef.current = transcriptPath;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        setLoading(false);
      }
    };

    loadTranscript();
  }, [transcriptPath]);

  // Set up transcript watcher for live updates
  useEffect(() => {
    // Don't start watcher until initial load is complete
    if (loading || error) {
      return;
    }

    const watcher = new TranscriptWatcher(transcriptPath, {
      onNewEntries: (newEntries) => {
        // Just append new entries - don't update seen count
        // This will hide the new entries until user scrolls to bottom
        dispatch({ type: 'APPEND_ENTRIES', entries: newEntries });
      },
      onError: (err) => {
        console.error('TranscriptWatcher error:', err);
      },
    });

    watcher.start();
    watcherRef.current = watcher;

    return () => {
      watcher.stop();
      watcherRef.current = null;
    };
  }, [transcriptPath, loading, error]);

  // Keyboard navigation
  useInput((input, key) => {
    if (loading || error) return;

    // Navigation
    if (key.upArrow || input === 'k') {
      dispatch({ type: 'NAVIGATE_UP' });
    } else if (key.downArrow || input === 'j') {
      dispatch({ type: 'NAVIGATE_DOWN' });
    }
    // Jump to latest message (vim-style Shift+G)
    else if (input === 'G') {
      dispatch({ type: 'JUMP_TO_LATEST' });
    }
    // Toggle system entries
    else if (input === 's') {
      dispatch({ type: 'TOGGLE_SYSTEM_ENTRIES' });
    }
    // Show tool detail view on Enter (if on a tool_use entry)
    else if (key.return && onShowToolDetail) {
      const currentEntry = visibleEntries.find((e) => e.uuid === state.selectedUuid);
      if (currentEntry && currentEntry.type === 'tool_use') {
        // Save current position before navigating away
        if (onSelectionChange && state.selectedUuid) {
          onSelectionChange(state.selectedUuid);
        }
        // Pass all entries (not just visible) so we can find the tool_result
        onShowToolDetail(currentEntry, state.entries);
      }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Transcript Viewer
          </Text>
          <Text dimColor> - Loading...</Text>
        </Box>
        <Text dimColor>Loading transcript...</Text>
      </Box>
    );
  }

  if (error) {
    // Check if this is a brand new session (within 10 seconds of start time)
    const now = Date.now();
    const sessionAge = now - session.startTime.getTime();
    const isNewSession = sessionAge < 10000; // 10 seconds

    // Show different message for new sessions vs actual errors
    if (isNewSession && error.includes('Transcript file not found')) {
      return (
        <Box flexDirection="column" padding={1}>
          <Box marginBottom={1}>
            <Text bold color="cyan">
              Transcript Viewer
            </Text>
            <Text dimColor> - New Session</Text>
          </Box>
          <Box marginBottom={1} flexDirection="column">
            <Text color="yellow">⏳ Waiting for session activity...</Text>
            <Box marginTop={1}>
              <Text>
                This session was just started. The transcript will become available once you interact with the Claude session.
              </Text>
            </Box>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text dimColor bold>What to do:</Text>
            <Box marginLeft={2} flexDirection="column">
              <Text dimColor>• Switch to your Claude session</Text>
              <Text dimColor>• Send a message or interact with Claude</Text>
              <Text dimColor>• Return here to view the transcript</Text>
            </Box>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press ESC to return to list</Text>
          </Box>
        </Box>
      );
    }

    // Show generic error for other cases
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Transcript Viewer
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
        <Text dimColor>Press ESC to return to list</Text>
      </Box>
    );
  }

  // Find selected index from UUID for display purposes
  const selectedIndex = visibleEntries.findIndex((e) => e.uuid === state.selectedUuid);
  const boundedSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Transcript Viewer
        </Text>
        <Text dimColor>
          {' '}
          - {visibleEntries.length} entries
          {newEntriesCount > 0 && <Text color="yellow"> (+{newEntriesCount} hidden)</Text>}
          {visibleEntries.length > 0 && <Text dimColor> • Entry {boundedSelectedIndex + 1}/{visibleEntries.length}</Text>}
        </Text>
      </Box>

      {/* Content */}
      <Box flexDirection="column" marginBottom={1}>
        {visibleEntries.length === 0 ? (
          <Text dimColor>No transcript entries found</Text>
        ) : (
          <>
            {visibleEntries.map((entry, index) => {
              const isSelected = entry.uuid === state.selectedUuid;
              // Only expand the selected entry
              const isExpanded = isSelected;

              return (
                <TranscriptEntryView
                  key={entry.uuid}
                  entry={entry}
                  entryNumber={index + 1}
                  isSelected={isSelected}
                  isExpanded={isExpanded}
                  isLast={index === visibleEntries.length - 1 && newEntriesCount === 0}
                />
              );
            })}

            {/* New messages indicator */}
            {newEntriesCount > 0 && (
              <Box
                borderStyle="single"
                borderColor="yellow"
                paddingX={1}
                paddingY={0}
                marginTop={1}
              >
                <Text color="yellow">
                  ▼ {newEntriesCount} new message{newEntriesCount > 1 ? 's' : ''} below (press j or G to view)
                </Text>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text dimColor>
            ↑/↓ or j/k: Navigate • Enter: Tool details • s: System entries ({state.showSystemEntries ? 'on' : 'off'}) • G: Jump to latest • ESC: Back
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

interface TranscriptEntryViewProps {
  entry: ParsedTranscriptEntry;
  entryNumber: number;
  isSelected: boolean;
  isExpanded: boolean;
  isLast: boolean;
}

function TranscriptEntryView({
  entry,
  entryNumber,
  isSelected,
  isExpanded,
  isLast,
}: TranscriptEntryViewProps) {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getColor = () => {
    if (entry.type === 'user') return 'cyan';
    if (entry.type === 'tool_use') return 'yellow';
    if (entry.type === 'tool_result') return entry.isError ? 'red' : 'gray';
    if (entry.type === 'thinking') return 'magenta';
    if (entry.type === 'system') return 'gray';
    if (entry.type === 'file-history') return 'gray';
    if (entry.type === 'meta') return 'gray';
    return 'green';
  };

  const getLabel = () => {
    if (entry.type === 'user') return 'User';
    if (entry.type === 'tool_use') return entry.toolName || 'Tool Use';
    if (entry.type === 'tool_result') return entry.isError ? 'Tool Error' : 'Tool Result';
    if (entry.type === 'thinking') return 'Thinking';
    if (entry.type === 'system') return 'System';
    if (entry.type === 'file-history') return 'File History';
    if (entry.type === 'meta') return 'Meta';
    return 'Assistant';
  };

  // Count lines in content
  const lineCount = entry.content.split('\n').length;
  const displayLineCount = lineCount > 1 ? ` (${lineCount} lines)` : '';

  // Prepare display content
  let displayContent: string;
  if (isExpanded) {
    displayContent = entry.content;
  } else {
    // Show first 3 lines as preview
    const lines = entry.content.split('\n');
    const previewLines = lines.slice(0, 3);
    displayContent = previewLines.join('\n');
    if (lines.length > 3) {
      displayContent += '\n...';
    }
  }

  return (
    <Box
      flexDirection="column"
      marginBottom={isLast ? 0 : 1}
      borderStyle={isSelected ? 'bold' : undefined}
      borderColor={isSelected ? 'cyan' : undefined}
      paddingX={1}
      paddingY={isSelected ? 1 : 0}
    >
      {/* Header line */}
      <Box>
        {isSelected && <Text bold color="cyan">► </Text>}
        <Text dimColor={!isSelected}>
          [{entryNumber}] [{formatTime(entry.timestamp)}]{' '}
        </Text>
        <Text bold color={getColor()}>
          {getLabel()}
        </Text>
        {displayLineCount && <Text dimColor>{displayLineCount}</Text>}
        {!isExpanded && lineCount > 3 && <Text dimColor> [collapsed]</Text>}
      </Box>

      {/* Content */}
      <Box marginLeft={2} flexDirection="column">
        {/* Tool use - use ToolDisplay component */}
        {entry.type === 'tool_use' && entry.toolInput && entry.toolName && entry.toolId ? (
          <ToolDisplay
            toolName={entry.toolName}
            toolInput={entry.toolInput}
            toolId={entry.toolId}
            mode={isExpanded ? 'expanded' : 'collapsed'}
          />
        ) : /* Render markdown for expanded user/assistant entries, plain text for others */
        isExpanded && (entry.type === 'user' || entry.type === 'assistant') ? (
          <MarkdownText>{displayContent}</MarkdownText>
        ) : (
          <Text>{displayContent}</Text>
        )}

        {/* System metadata (if expanded) */}
        {isExpanded && entry.type === 'system' && entry.compactMetadata && (
          <Box marginTop={1} marginLeft={2}>
            <Text dimColor>
              Compacted {entry.compactMetadata.preTokens.toLocaleString()} tokens (
              {entry.compactMetadata.trigger})
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
