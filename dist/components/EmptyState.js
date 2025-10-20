import React from 'react';
import { Box, Text } from 'ink';
export function EmptyState() {
    return (React.createElement(Box, { flexDirection: "column", padding: 2 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Agent Tracker - Welcome!")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, null, "No session events found. To start tracking Claude Code sessions, you need to install the Agent Tracker plugin.")),
        React.createElement(Box, { marginBottom: 1, flexDirection: "column" },
            React.createElement(Text, { bold: true, underline: true }, "Installation Steps:"),
            React.createElement(Box, { marginTop: 1, marginLeft: 2, flexDirection: "column" },
                React.createElement(Text, null, "1. Add the plugin marketplace (run this in a Claude Code session):"),
                React.createElement(Box, { marginLeft: 3, marginTop: 0, marginBottom: 1 },
                    React.createElement(Text, { color: "yellow" }, "/plugin marketplace add /path/to/agent-tracker")),
                React.createElement(Text, null, "2. Install the agent-tracker plugin:"),
                React.createElement(Box, { marginLeft: 3, marginTop: 0, marginBottom: 1 },
                    React.createElement(Text, { color: "yellow" }, "/plugin install agent-tracker")),
                React.createElement(Text, null, "3. Start a new Claude Code session to begin tracking"))),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "For more information, see the README at:")),
        React.createElement(Box, { marginLeft: 2, marginBottom: 1 },
            React.createElement(Text, { color: "cyan" }, "https://github.com/wakeless/agent-tracker")),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Press q or Ctrl+C to quit"))));
}
//# sourceMappingURL=EmptyState.js.map