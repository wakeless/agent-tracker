import React from 'react';
import { Box, Text } from 'ink';
import { isGrepInput } from './ToolDisplayProps.js';
export function GrepTool({ toolInput, mode }) {
    if (!isGrepInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid Grep input");
    }
    const { pattern, path, output_mode, glob, type } = toolInput;
    if (mode === 'collapsed') {
        // Show pattern with path indicator
        const pathDisplay = path ? ` (${path})` : '';
        return (React.createElement(Text, null,
            React.createElement(Text, { dimColor: true }, "\uD83D\uDD0D "),
            React.createElement(Text, null,
                "\"",
                pattern,
                "\""),
            React.createElement(Text, { dimColor: true }, pathDisplay)));
    }
    // Expanded mode - show pattern, path, and filters
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "Pattern: "),
            React.createElement(Text, null, pattern)),
        path && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "Path: "),
            React.createElement(Text, null, path))),
        output_mode && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "Output mode: "),
            React.createElement(Text, null, output_mode))),
        glob && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "Glob: "),
            React.createElement(Text, null, glob))),
        type && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "Type: "),
            React.createElement(Text, null, type))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true, italic: true }, "Press Enter to view full results \u2192"))));
}
//# sourceMappingURL=GrepTool.js.map