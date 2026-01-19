import React from 'react';
import { Box, Text } from 'ink';
/**
 * Displays a code block with language label and border.
 */
export function CodeBlock({ language, code }) {
    const displayLanguage = language || 'text';
    return (React.createElement(Box, { flexDirection: "column", marginY: 1 },
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, '┌─ '),
            React.createElement(Text, { color: "cyan" }, displayLanguage),
            React.createElement(Text, { dimColor: true }, ' ─────────────────────────────────────────')),
        React.createElement(Box, { flexDirection: "column", paddingLeft: 1 }, code.split('\n').map((line, i) => (React.createElement(Box, { key: i },
            React.createElement(Text, { dimColor: true }, "\u2502 "),
            React.createElement(Text, null, line))))),
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, '└─────────────────────────────────────────────────'))));
}
//# sourceMappingURL=CodeBlock.js.map