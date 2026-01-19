import React from 'react';
import { Box, Text } from 'ink';
import { computeDiff, filterDiffWithContext } from './computeDiff.js';
/**
 * Unified diff display component with colored additions/removals
 */
export function DiffViewer({ oldText, newText, oldLabel = 'before', newLabel = 'after', contextLines = 3, showAllLines = false, }) {
    // Compute the diff
    const fullDiff = computeDiff(oldText, newText);
    // Filter to show only relevant context unless showing all
    const displayDiff = showAllLines ? fullDiff : filterDiffWithContext(fullDiff, contextLines);
    // Calculate statistics
    const additions = fullDiff.filter(l => l.type === 'add').length;
    const removals = fullDiff.filter(l => l.type === 'remove').length;
    // Calculate line number widths
    const maxOldLineNum = Math.max(...fullDiff.filter(l => l.oldLineNumber).map(l => l.oldLineNumber), 1);
    const maxNewLineNum = Math.max(...fullDiff.filter(l => l.newLineNumber).map(l => l.newLineNumber), 1);
    const oldLineNumWidth = String(maxOldLineNum).length;
    const newLineNumWidth = String(maxNewLineNum).length;
    // Build header
    const headerLabel = 'diff';
    const headerLine = `─ ${headerLabel} `;
    const headerPadding = '─'.repeat(Math.max(0, 45 - headerLine.length));
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true },
                "\u250C",
                headerLine,
                headerPadding,
                "\u2510")),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "\u2502 "),
            React.createElement(Text, { color: "green" },
                "+",
                additions),
            React.createElement(Text, { dimColor: true }, " / "),
            React.createElement(Text, { color: "red" },
                "-",
                removals),
            React.createElement(Text, { dimColor: true },
                " (",
                oldLabel,
                " \u2192 ",
                newLabel,
                ")")),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true },
                "\u251C",
                '─'.repeat(Math.max(0, headerLine.length + headerPadding.length)),
                "\u2524")),
        displayDiff.length === 0 ? (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "\u2502 No changes"))) : (displayDiff.map((diffLine, idx) => (React.createElement(DiffLineComponent, { key: idx, diffLine: diffLine, oldLineNumWidth: oldLineNumWidth, newLineNumWidth: newLineNumWidth })))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true },
                "\u2514",
                '─'.repeat(Math.max(0, headerLine.length + headerPadding.length)),
                "\u2518"))));
}
function DiffLineComponent({ diffLine, oldLineNumWidth, newLineNumWidth }) {
    const { type, line, oldLineNumber, newLineNumber } = diffLine;
    // Handle separator
    if (line === '...') {
        return (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true },
                "\u2502 ",
                '─'.repeat(oldLineNumWidth + newLineNumWidth + 7))));
    }
    // Format line numbers
    const oldNum = oldLineNumber !== undefined ? String(oldLineNumber).padStart(oldLineNumWidth, ' ') : ' '.repeat(oldLineNumWidth);
    const newNum = newLineNumber !== undefined ? String(newLineNumber).padStart(newLineNumWidth, ' ') : ' '.repeat(newLineNumWidth);
    // Determine colors and indicator
    let indicator;
    let lineColor;
    let indicatorColor;
    switch (type) {
        case 'add':
            indicator = '+';
            lineColor = 'green';
            indicatorColor = 'green';
            break;
        case 'remove':
            indicator = '-';
            lineColor = 'red';
            indicatorColor = 'red';
            break;
        case 'context':
        default:
            indicator = ' ';
            lineColor = undefined;
            indicatorColor = 'gray';
            break;
    }
    return (React.createElement(Box, null,
        React.createElement(Text, { dimColor: true }, "\u2502 "),
        React.createElement(Text, { dimColor: true }, oldNum),
        React.createElement(Text, { dimColor: true }, " "),
        React.createElement(Text, { dimColor: true }, newNum),
        React.createElement(Text, { dimColor: true }, " "),
        React.createElement(Text, { color: indicatorColor }, indicator),
        React.createElement(Text, { dimColor: true }, " "),
        React.createElement(Text, { color: lineColor }, line || ' ')));
}
//# sourceMappingURL=DiffViewer.js.map