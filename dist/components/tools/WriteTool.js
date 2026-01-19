import React from 'react';
import { Box, Text } from 'ink';
import { isWriteInput } from './ToolDisplayProps.js';
export function WriteTool({ toolInput, mode }) {
    if (!isWriteInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid Write input");
    }
    const { file_path, content } = toolInput;
    // Extract just the filename from the path
    const fileName = file_path.split('/').pop() || file_path;
    // Calculate stats
    const lines = content.split('\n');
    const lineCount = lines.length;
    if (mode === 'collapsed') {
        return (React.createElement(Text, null,
            React.createElement(Text, { dimColor: true }, "+ "),
            fileName,
            React.createElement(Text, { dimColor: true },
                " (",
                lineCount,
                " lines)")));
    }
    // Expanded mode - show file path and preview
    const charCount = content.length;
    // Show first few lines as preview
    const previewLines = lines.slice(0, 5);
    const hasMore = lines.length > 5;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "File: "),
            React.createElement(Text, null, file_path)),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true },
                "Writing ",
                lineCount,
                " line",
                lineCount !== 1 ? 's' : '',
                " (",
                charCount,
                " chars)")),
        React.createElement(Box, { marginTop: 1, flexDirection: "column" },
            React.createElement(Text, { dimColor: true }, "Preview:"),
            previewLines.map((line, idx) => (React.createElement(Box, { key: idx, marginLeft: 2 },
                React.createElement(Text, { dimColor: true },
                    String(idx + 1).padStart(3, ' '),
                    " \u2502 "),
                React.createElement(Text, null, line || ' ')))),
            hasMore && (React.createElement(Box, { marginLeft: 2 },
                React.createElement(Text, { dimColor: true }, "    \u2502 ...")))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "cyan" }, "Press Enter to view full content \u2192"))));
}
//# sourceMappingURL=WriteTool.js.map