import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Box, Text, useInput } from 'ink';
import { TranscriptReader } from '../services/TranscriptReader.js';
import { TranscriptWatcher } from '../services/TranscriptWatcher.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';
import { MarkdownText } from './MarkdownText.js';
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
  onShowToolDetail?: (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => void;
}

export function TranscriptViewer({ transcriptPath, sessionId, onShowToolDetail }: TranscriptViewerProps) {
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
        dispatch({ type: 'LOAD_TRANSCRIPT', entries: parsedEntries });
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
      const boundedIndex = Math.min(state.selectedIndex, Math.max(0, visibleEntries.length - 1));
      const currentEntry = visibleEntries[boundedIndex];
      if (currentEntry && currentEntry.type === 'tool_use') {
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

  const boundedSelectedIndex = Math.min(state.selectedIndex, Math.max(0, visibleEntries.length - 1));

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
              const isSelected = index === boundedSelectedIndex;
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
        {/* Render markdown for expanded user/assistant entries, plain text for others */}
        {isExpanded && (entry.type === 'user' || entry.type === 'assistant') ? (
          <MarkdownText>{displayContent}</MarkdownText>
        ) : (
          <Text>{displayContent}</Text>
        )}

        {/* Tool input details (if expanded) */}
        {isExpanded && entry.type === 'tool_use' && entry.toolInput && (
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor>Input:</Text>
            <Box marginLeft={2}>
              <Text dimColor>{JSON.stringify(entry.toolInput, null, 2)}</Text>
            </Box>
          </Box>
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
