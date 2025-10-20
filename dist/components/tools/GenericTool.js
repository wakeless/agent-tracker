import React from 'react';
import { Box, Text } from 'ink';
export function GenericTool({ toolName, toolInput, mode }) {
    if (mode === 'collapsed') {
        return React.createElement(Text, { dimColor: true },
            "Used tool: ",
            toolName);
    }
    // Expanded mode - show JSON but formatted
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { dimColor: true }, "Input:"),
        React.createElement(Box, { marginLeft: 2 },
            React.createElement(Text, { dimColor: true }, JSON.stringify(toolInput, null, 2)))));
}
//# sourceMappingURL=GenericTool.js.map