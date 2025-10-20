import React from 'react';
import { Box, Text } from 'ink';
import { isBashInput } from './ToolDisplayProps.js';
export function BashTool({ toolInput, mode }) {
    if (!isBashInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid Bash input");
    }
    const { command, description } = toolInput;
    if (mode === 'collapsed') {
        // Prefer description if available, otherwise show command
        if (description) {
            return React.createElement(Text, null, description);
        }
        // Truncate long commands in collapsed mode
        const maxLength = 60;
        const displayCommand = command.length > maxLength
            ? command.substring(0, maxLength) + '...'
            : command;
        return (React.createElement(Text, null,
            React.createElement(Text, { dimColor: true }, "$ "),
            displayCommand));
    }
    // Expanded mode - show both command and description
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { dimColor: true }, "$ "),
            React.createElement(Text, null, command)),
        description && (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, description)))));
}
//# sourceMappingURL=BashTool.js.map