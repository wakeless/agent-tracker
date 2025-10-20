import React from 'react';
import { Box, Text } from 'ink';
import { isReadInput } from './ToolDisplayProps.js';
export function ReadTool({ toolInput, mode }) {
    if (!isReadInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid Read input");
    }
    const { file_path, offset, limit } = toolInput;
    // Extract just the filename from the path
    const fileName = file_path.split('/').pop() || file_path;
    if (mode === 'collapsed') {
        let lineInfo = '';
        if (offset !== undefined && limit !== undefined) {
            const endLine = offset + limit;
            lineInfo = ` (lines ${offset}-${endLine})`;
        }
        else if (offset !== undefined) {
            lineInfo = ` (from line ${offset})`;
        }
        else if (limit !== undefined) {
            lineInfo = ` (first ${limit} lines)`;
        }
        return (React.createElement(Text, null,
            React.createElement(Text, { dimColor: true }, "\uD83D\uDCD6 "),
            fileName,
            lineInfo && React.createElement(Text, { dimColor: true }, lineInfo)));
    }
    // Expanded mode - show full path and line range
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "File: "),
            React.createElement(Text, null, file_path)),
        (offset !== undefined || limit !== undefined) && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, offset !== undefined && limit !== undefined
                ? `Reading lines ${offset}-${offset + limit}`
                : offset !== undefined
                    ? `Reading from line ${offset}`
                    : `Reading first ${limit} lines`)))));
}
//# sourceMappingURL=ReadTool.js.map