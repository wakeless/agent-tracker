import React from 'react';
import { Box, Text } from 'ink';
/**
 * Enhanced code display component with line numbers and borders
 */
export function CodeViewer({ code, language, showLineNumbers = true, startLine = 1, highlightLines = [], maxHeight, }) {
    const lines = code.split('\n');
    const highlightSet = new Set(highlightLines);
    // Calculate line number width for padding
    const maxLineNum = startLine + lines.length - 1;
    const lineNumWidth = String(maxLineNum).length;
    // Determine if we need to truncate
    const shouldTruncate = maxHeight !== undefined && lines.length > maxHeight;
    const displayLines = shouldTruncate ? lines.slice(0, maxHeight) : lines;
    const hiddenCount = shouldTruncate ? lines.length - maxHeight : 0;
    // Build header
    const headerLabel = language || 'code';
    const headerLine = `─ ${headerLabel} `;
    const headerPadding = '─'.repeat(Math.max(0, 40 - headerLine.length));
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true },
                "\u250C",
                headerLine,
                headerPadding,
                "\u2510")),
        displayLines.map((line, idx) => {
            const lineNum = startLine + idx;
            const isHighlighted = highlightSet.has(lineNum);
            return (React.createElement(Box, { key: idx },
                React.createElement(Text, { dimColor: true }, "\u2502 "),
                showLineNumbers && (React.createElement(Text, { dimColor: !isHighlighted, color: isHighlighted ? 'yellow' : undefined }, String(lineNum).padStart(lineNumWidth, ' '))),
                showLineNumbers && React.createElement(Text, { dimColor: true }, " \u2502 "),
                React.createElement(Text, { color: isHighlighted ? 'yellow' : undefined }, line || ' ')));
        }),
        shouldTruncate && (React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "\u2502 "),
            React.createElement(Text, { color: "yellow" },
                "... ",
                hiddenCount,
                " more line",
                hiddenCount !== 1 ? 's' : '',
                " (scroll in detail view)"))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true },
                "\u2514",
                '─'.repeat(Math.max(0, headerLine.length + headerPadding.length)),
                "\u2518"))));
}
//# sourceMappingURL=CodeViewer.js.map