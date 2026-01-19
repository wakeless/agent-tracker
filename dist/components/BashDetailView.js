import React from 'react';
import { Box, Text } from 'ink';
import { CodeViewer } from './code-viewer/index.js';
/**
 * Detail view for Bash tool showing command and full output
 */
export function BashDetailView({ bashInput, toolResult }) {
    const { command, description, timeout, run_in_background } = bashInput;
    // Get output from tool result
    const output = toolResult?.content || '';
    const isError = toolResult?.isError || false;
    const isPending = !toolResult;
    // Calculate stats
    const lineCount = output ? output.split('\n').length : 0;
    // Determine status text and color
    let statusText;
    let statusColor;
    if (isPending) {
        statusText = 'Pending';
        statusColor = 'yellow';
    }
    else if (isError) {
        statusText = 'Error';
        statusColor = 'red';
    }
    else {
        statusText = 'Success';
        statusColor = 'green';
    }
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { borderStyle: "single", borderColor: isError ? 'red' : 'cyan', paddingX: 1, marginBottom: 1 },
            React.createElement(Text, { bold: true, color: isError ? 'red' : 'cyan' },
                "Bash: ",
                command.length > 50 ? command.substring(0, 50) + '...' : command)),
        description && (React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, null, description))),
        (timeout || run_in_background) && (React.createElement(Box, { marginBottom: 1 },
            timeout && React.createElement(Text, { dimColor: true },
                "Timeout: ",
                timeout,
                "ms "),
            run_in_background && React.createElement(Text, { dimColor: true }, "[background]"))),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "Status: "),
            React.createElement(Text, { color: statusColor, bold: true }, statusText),
            lineCount > 0 && React.createElement(Text, { dimColor: true },
                " (",
                lineCount,
                " lines)")),
        output ? (React.createElement(Box, { marginBottom: 1 },
            React.createElement(CodeViewer, { code: output, language: isError ? 'output (error)' : 'output', showLineNumbers: true }))) : isPending ? (React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "Waiting for command to complete..."))) : (React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "No output"))),
        React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { dimColor: true }, "ESC: back to transcript"))));
}
//# sourceMappingURL=BashDetailView.js.map