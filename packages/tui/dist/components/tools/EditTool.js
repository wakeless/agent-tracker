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
    // Show first few lines of diff as preview
    const oldPreview = old_string.split('\n').slice(0, 3);
    const newPreview = new_string.split('\n').slice(0, 3);
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
            React.createElement(Text, { color: "yellow" }, "Replace all occurrences"))),
        React.createElement(Box, { marginTop: 1, flexDirection: "column" },
            oldPreview.map((line, idx) => (React.createElement(Box, { key: `old-${idx}`, marginLeft: 2 },
                React.createElement(Text, { color: "red" },
                    "- ",
                    line || ' ')))),
            oldLines > 3 && (React.createElement(Box, { marginLeft: 2 },
                React.createElement(Text, { color: "red", dimColor: true }, "  ..."))),
            newPreview.map((line, idx) => (React.createElement(Box, { key: `new-${idx}`, marginLeft: 2 },
                React.createElement(Text, { color: "green" },
                    "+ ",
                    line || ' ')))),
            newLines > 3 && (React.createElement(Box, { marginLeft: 2 },
                React.createElement(Text, { color: "green", dimColor: true }, "  ...")))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "cyan" }, "Press Enter to view full diff \u2192"))));
}
//# sourceMappingURL=EditTool.js.map