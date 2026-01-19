import React from 'react';
import { Box, Text } from 'ink';
export function EmptyState() {
    return (React.createElement(Box, { flexDirection: "column", padding: 2 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Agent Tracker")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, null, "No Claude Code sessions found.")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "Start a Claude Code session to begin tracking. Sessions will appear")),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "automatically as you use Claude Code in any project.")),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Looking for sessions in: ~/.claude/projects/")),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Press q or Ctrl+C to quit"))));
}
//# sourceMappingURL=EmptyState.js.map