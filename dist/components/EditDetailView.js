import React from 'react';
import { Box, Text } from 'ink';
import { DiffViewer } from './code-viewer/index.js';
/**
 * Detail view for Edit tool showing full diff visualization
 */
export function EditDetailView({ editInput }) {
    const { file_path, old_string, new_string, replace_all } = editInput;
    // Calculate some stats
    const oldLines = old_string.split('\n').length;
    const newLines = new_string.split('\n').length;
    const oldChars = old_string.length;
    const newChars = new_string.length;
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 1, marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" },
                "Edit: ",
                file_path)),
        React.createElement(Box, { marginBottom: 1 },
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
                " chars)"),
            replace_all && (React.createElement(Text, { color: "yellow" }, " [replace all occurrences]"))),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(DiffViewer, { oldText: old_string, newText: new_string, oldLabel: "before", newLabel: "after", showAllLines: true })),
        React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { dimColor: true }, "ESC: back to transcript"))));
}
//# sourceMappingURL=EditDetailView.js.map