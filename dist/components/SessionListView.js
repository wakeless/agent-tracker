import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SessionList } from './SessionList.js';
import { SessionDetail } from './SessionDetail.js';
import { TranscriptReader } from '../services/TranscriptReader.js';
export function SessionListView({ sessions, selectedSessionId, service, onSelectSession, onViewTranscript, }) {
    const [recentTranscript, setRecentTranscript] = useState([]);
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
            }
            catch (error) {
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
        }
        else if (key.downArrow || input === 'j') {
            // Navigate to next session
            const currentIdx = sessions.findIndex((s) => s.id === selectedSessionId);
            if (currentIdx >= 0 && currentIdx < sessions.length - 1) {
                onSelectSession(sessions[currentIdx + 1].id);
            }
        }
        else if (key.return && selectedSessionId) {
            // Press Enter to view transcript
            onViewTranscript(selectedSessionId);
        }
    });
    const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;
    const counts = service.getSessionCounts();
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Agent Tracker"),
            React.createElement(Text, { dimColor: true }, " - Tracking Claude Code Sessions")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, null, "Total: "),
                React.createElement(Text, { bold: true }, counts.total)),
            counts.awaitingInput > 0 && (React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { color: "magenta" }, "\u23F3 Awaiting Input: "),
                React.createElement(Text, { bold: true, color: "magenta" }, counts.awaitingInput))),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { color: "green" }, "Active: "),
                React.createElement(Text, { bold: true, color: "green" }, counts.active)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { color: "yellow" }, "Inactive: "),
                React.createElement(Text, { bold: true, color: "yellow" }, counts.inactive)),
            React.createElement(Box, null,
                React.createElement(Text, { color: "red" }, "Ended: "),
                React.createElement(Text, { bold: true, color: "red" }, counts.ended))),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray" },
            React.createElement(Box, { flexGrow: 1, borderStyle: "single", borderColor: "gray" },
                React.createElement(SessionList, { sessions: sessions, selectedSessionId: selectedSessionId })),
            React.createElement(Box, { flexGrow: 2 },
                React.createElement(SessionDetail, { session: selectedSession, recentTranscript: recentTranscript }))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Navigation: \u2191/\u2193 or j/k \u2022 Enter: View transcript \u2022 Quit: q or Ctrl+C"))));
}
//# sourceMappingURL=SessionListView.js.map