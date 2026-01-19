import React from 'react';
import { Box, Text } from 'ink';
import { CodeViewer } from './code-viewer/index.js';
/**
 * Detail view for Grep tool showing pattern and full search results
 */
export function GrepDetailView({ grepInput, toolResult }) {
    const { pattern, path, output_mode, glob, type } = grepInput;
    // Get output from tool result
    const output = toolResult?.content || '';
    const isError = toolResult?.isError || false;
    const isPending = !toolResult;
    // Calculate stats
    const lines = output ? output.split('\n').filter(line => line.trim()) : [];
    const matchCount = lines.length;
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
        statusText = `Success (${matchCount} match${matchCount !== 1 ? 'es' : ''})`;
        statusColor = 'green';
    }
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { borderStyle: "single", borderColor: isError ? 'red' : 'cyan', paddingX: 1, marginBottom: 1 },
            React.createElement(Text, { bold: true, color: isError ? 'red' : 'cyan' },
                "Grep: \"",
                pattern,
                "\"")),
        React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
            path && (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Path: "),
                React.createElement(Text, null, path))),
            output_mode && (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Output mode: "),
                React.createElement(Text, null, output_mode))),
            glob && (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Glob filter: "),
                React.createElement(Text, null, glob))),
            type && (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "File type: "),
                React.createElement(Text, null, type)))),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "Status: "),
            React.createElement(Text, { color: statusColor, bold: true }, statusText)),
        output ? (React.createElement(Box, { marginBottom: 1 },
            React.createElement(CodeViewer, { code: output, language: isError ? 'error' : 'results', showLineNumbers: true }))) : isPending ? (React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "Waiting for search to complete..."))) : (React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { dimColor: true }, "No matches found"))),
        React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { dimColor: true }, "ESC: back to transcript"))));
}
//# sourceMappingURL=GrepDetailView.js.map