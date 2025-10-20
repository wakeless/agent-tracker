import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Box, Text, useInput } from 'ink';
import { TranscriptReader } from '../services/TranscriptReader.js';
import { TranscriptWatcher } from '../services/TranscriptWatcher.js';
import { MarkdownText } from './MarkdownText.js';
import { ToolDisplay } from './tools/index.js';
import { transcriptReducer, initialState, getFilteredEntries, getVisibleEntriesFromState, getNewEntriesCount, } from '../reducers/transcriptReducer.js';
export function TranscriptViewer({ transcriptPath, sessionId, session, onShowToolDetail, initialSelectedUuid, onSelectionChange }) {
    const [state, dispatch] = useReducer(transcriptReducer, initialState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const watcherRef = useRef(null);
    const lastTranscriptPathRef = useRef('');
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
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load transcript');
            }
            finally {
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
        if (loading || error)
            return;
        // Navigation
        if (key.upArrow || input === 'k') {
            dispatch({ type: 'NAVIGATE_UP' });
        }
        else if (key.downArrow || input === 'j') {
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
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true, color: "cyan" }, "Transcript Viewer"),
                React.createElement(Text, { dimColor: true }, " - Loading...")),
            React.createElement(Text, { dimColor: true }, "Loading transcript...")));
    }
    if (error) {
        // Check if this is a brand new session (within 10 seconds of start time)
        const now = Date.now();
        const sessionAge = now - session.startTime.getTime();
        const isNewSession = sessionAge < 10000; // 10 seconds
        // Show different message for new sessions vs actual errors
        if (isNewSession && error.includes('Transcript file not found')) {
            return (React.createElement(Box, { flexDirection: "column", padding: 1 },
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true, color: "cyan" }, "Transcript Viewer"),
                    React.createElement(Text, { dimColor: true }, " - New Session")),
                React.createElement(Box, { marginBottom: 1, flexDirection: "column" },
                    React.createElement(Text, { color: "yellow" }, "\u23F3 Waiting for session activity..."),
                    React.createElement(Box, { marginTop: 1 },
                        React.createElement(Text, null, "This session was just started. The transcript will become available once you interact with the Claude session."))),
                React.createElement(Box, { marginTop: 1, flexDirection: "column" },
                    React.createElement(Text, { dimColor: true, bold: true }, "What to do:"),
                    React.createElement(Box, { marginLeft: 2, flexDirection: "column" },
                        React.createElement(Text, { dimColor: true }, "\u2022 Switch to your Claude session"),
                        React.createElement(Text, { dimColor: true }, "\u2022 Send a message or interact with Claude"),
                        React.createElement(Text, { dimColor: true }, "\u2022 Return here to view the transcript"))),
                React.createElement(Box, { marginTop: 1 },
                    React.createElement(Text, { dimColor: true }, "Press ESC to return to list"))));
        }
        // Show generic error for other cases
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true, color: "cyan" }, "Transcript Viewer")),
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { color: "red" },
                    "Error: ",
                    error)),
            React.createElement(Text, { dimColor: true }, "Press ESC to return to list")));
    }
    // Find selected index from UUID for display purposes
    const selectedIndex = visibleEntries.findIndex((e) => e.uuid === state.selectedUuid);
    const boundedSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Transcript Viewer"),
            React.createElement(Text, { dimColor: true },
                ' ',
                "- ",
                visibleEntries.length,
                " entries",
                newEntriesCount > 0 && React.createElement(Text, { color: "yellow" },
                    " (+",
                    newEntriesCount,
                    " hidden)"),
                visibleEntries.length > 0 && React.createElement(Text, { dimColor: true },
                    " \u2022 Entry ",
                    boundedSelectedIndex + 1,
                    "/",
                    visibleEntries.length))),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 }, visibleEntries.length === 0 ? (React.createElement(Text, { dimColor: true }, "No transcript entries found")) : (React.createElement(React.Fragment, null,
            visibleEntries.map((entry, index) => {
                const isSelected = entry.uuid === state.selectedUuid;
                // Only expand the selected entry
                const isExpanded = isSelected;
                return (React.createElement(TranscriptEntryView, { key: entry.uuid, entry: entry, entryNumber: index + 1, isSelected: isSelected, isExpanded: isExpanded, isLast: index === visibleEntries.length - 1 && newEntriesCount === 0 }));
            }),
            newEntriesCount > 0 && (React.createElement(Box, { borderStyle: "single", borderColor: "yellow", paddingX: 1, paddingY: 0, marginTop: 1 },
                React.createElement(Text, { color: "yellow" },
                    "\u25BC ",
                    newEntriesCount,
                    " new message",
                    newEntriesCount > 1 ? 's' : '',
                    " below (press j or G to view)")))))),
        React.createElement(Box, { marginTop: 1, flexDirection: "column" },
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true },
                    "\u2191/\u2193 or j/k: Navigate \u2022 Enter: Tool details \u2022 s: System entries (",
                    state.showSystemEntries ? 'on' : 'off',
                    ") \u2022 G: Jump to latest \u2022 ESC: Back")))));
}
function TranscriptEntryView({ entry, entryNumber, isSelected, isExpanded, isLast, }) {
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };
    const getColor = () => {
        if (entry.type === 'user')
            return 'cyan';
        if (entry.type === 'tool_use')
            return 'yellow';
        if (entry.type === 'tool_result')
            return entry.isError ? 'red' : 'gray';
        if (entry.type === 'thinking')
            return 'magenta';
        if (entry.type === 'system')
            return 'gray';
        if (entry.type === 'file-history')
            return 'gray';
        if (entry.type === 'meta')
            return 'gray';
        return 'green';
    };
    const getLabel = () => {
        if (entry.type === 'user')
            return 'User';
        if (entry.type === 'tool_use')
            return entry.toolName || 'Tool Use';
        if (entry.type === 'tool_result')
            return entry.isError ? 'Tool Error' : 'Tool Result';
        if (entry.type === 'thinking')
            return 'Thinking';
        if (entry.type === 'system')
            return 'System';
        if (entry.type === 'file-history')
            return 'File History';
        if (entry.type === 'meta')
            return 'Meta';
        return 'Assistant';
    };
    // Count lines in content
    const lineCount = entry.content.split('\n').length;
    const displayLineCount = lineCount > 1 ? ` (${lineCount} lines)` : '';
    // Prepare display content
    let displayContent;
    if (isExpanded) {
        displayContent = entry.content;
    }
    else {
        // Show first 3 lines as preview
        const lines = entry.content.split('\n');
        const previewLines = lines.slice(0, 3);
        displayContent = previewLines.join('\n');
        if (lines.length > 3) {
            displayContent += '\n...';
        }
    }
    return (React.createElement(Box, { flexDirection: "column", marginBottom: isLast ? 0 : 1, borderStyle: isSelected ? 'bold' : undefined, borderColor: isSelected ? 'cyan' : undefined, paddingX: 1, paddingY: isSelected ? 1 : 0 },
        React.createElement(Box, null,
            isSelected && React.createElement(Text, { bold: true, color: "cyan" }, "\u25BA "),
            React.createElement(Text, { dimColor: !isSelected },
                "[",
                entryNumber,
                "] [",
                formatTime(entry.timestamp),
                "]",
                ' '),
            React.createElement(Text, { bold: true, color: getColor() }, getLabel()),
            displayLineCount && React.createElement(Text, { dimColor: true }, displayLineCount),
            !isExpanded && lineCount > 3 && React.createElement(Text, { dimColor: true }, " [collapsed]")),
        React.createElement(Box, { marginLeft: 2, flexDirection: "column" },
            entry.type === 'tool_use' && entry.toolInput && entry.toolName && entry.toolId ? (React.createElement(ToolDisplay, { toolName: entry.toolName, toolInput: entry.toolInput, toolId: entry.toolId, mode: isExpanded ? 'expanded' : 'collapsed' })) : /* Render markdown for expanded user/assistant entries, plain text for others */
                isExpanded && (entry.type === 'user' || entry.type === 'assistant') ? (React.createElement(MarkdownText, null, displayContent)) : (React.createElement(Text, null, displayContent)),
            isExpanded && entry.type === 'system' && entry.compactMetadata && (React.createElement(Box, { marginTop: 1, marginLeft: 2 },
                React.createElement(Text, { dimColor: true },
                    "Compacted ",
                    entry.compactMetadata.preTokens.toLocaleString(),
                    " tokens (",
                    entry.compactMetadata.trigger,
                    ")"))))));
}
//# sourceMappingURL=TranscriptViewer.js.map