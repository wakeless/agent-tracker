import React from 'react';
import { Box, Text } from 'ink';
import { isEditInput } from './ToolDisplayProps.js';
export function EditTool({ toolInput, mode }) {
    if (!isEditInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid Edit input");
    }
    const { file_path, old_string, new_string, replace_all } = toolInput;
    // Extract just the filename from the path
    const fileName = file_path.split('/').pop() || file_path;
    if (mode === 'collapsed') {
        return (React.createElement(Text, null,
            React.createElement(Text, { dimColor: true }, "\u270E "),
            fileName,
            replace_all && React.createElement(Text, { dimColor: true }, " (replace all)")));
    }
    // Expanded mode - show file path and edit details
    const oldLines = old_string.split('\n').length;
    const newLines = new_string.split('\n').length;
    const oldChars = old_string.length;
    const newChars = new_string.length;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "File: "),
            React.createElement(Text, null, file_path)),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true },
                "Replacing ",
                oldLines,
                " line",
                oldLines !== 1 ? 's' : '',
                " (",
                oldChars,
                " chars) with ",
                newLines,
                " line",
                newLines !== 1 ? 's' : '',
                " (",
                newChars,
                " chars)")),
        replace_all && (React.createElement(Box, null,
            React.createElement(Text, { color: "yellow" }, "Replace all occurrences")))));
}
//# sourceMappingURL=EditTool.js.map