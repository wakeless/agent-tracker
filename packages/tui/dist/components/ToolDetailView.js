import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownText } from './MarkdownText.js';
export function ToolDetailView({ toolUseEntry, toolResultEntry }) {
    // Keyboard input (ESC) is handled globally by App.tsx navigation stack
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };
    const toolName = toolUseEntry.toolName || 'Unknown Tool';
    const hasError = toolResultEntry?.isError === true;
    const statusColor = hasError ? 'red' : toolResultEntry ? 'green' : 'yellow';
    const statusText = hasError ? 'Error' : toolResultEntry ? 'Success' : 'Pending';
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, "Tool Detail"),
            React.createElement(Text, { dimColor: true },
                " - ",
                toolName)),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "Status: "),
            React.createElement(Text, { bold: true, color: statusColor }, statusText),
            React.createElement(Text, { dimColor: true },
                " \u2022 Executed at ",
                formatTime(toolUseEntry.timestamp))),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "yellow" }, "Input Parameters:"),
            React.createElement(Box, { marginLeft: 2, marginTop: 1, flexDirection: "column" }, toolUseEntry.toolInput ? (React.createElement(MarkdownText, null, '```json\n' + JSON.stringify(toolUseEntry.toolInput, null, 2) + '\n```')) : (React.createElement(Text, { dimColor: true }, "(no input)")))),
        toolResultEntry && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            React.createElement(Text, { bold: true, color: hasError ? 'red' : 'green' }, hasError ? 'Error Output:' : 'Output:'),
            React.createElement(Box, { marginLeft: 2, marginTop: 1, flexDirection: "column" },
                React.createElement(MarkdownText, null, toolResultEntry.content)))),
        !toolResultEntry && (React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "No output available (tool execution may still be pending)"))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "ESC: Back to transcript"))));
}
//# sourceMappingURL=ToolDetailView.js.map