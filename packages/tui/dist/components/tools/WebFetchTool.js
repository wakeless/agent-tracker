import React from 'react';
import { Box, Text } from 'ink';
import { isWebFetchInput } from './ToolDisplayProps.js';
export function WebFetchTool({ toolInput, mode }) {
    if (!isWebFetchInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid WebFetch input");
    }
    const { url, prompt } = toolInput;
    // Extract domain from URL
    const getDomain = (urlString) => {
        try {
            const urlObj = new URL(urlString);
            return urlObj.hostname;
        }
        catch {
            return urlString;
        }
    };
    if (mode === 'collapsed') {
        const domain = getDomain(url);
        return (React.createElement(Text, null,
            React.createElement(Text, { dimColor: true }, "\uD83C\uDF10 "),
            domain));
    }
    // Expanded mode - show full URL and prompt summary
    const maxPromptLength = 100;
    const promptSummary = prompt.length > maxPromptLength
        ? prompt.substring(0, maxPromptLength) + '...'
        : prompt;
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "URL: "),
            React.createElement(Text, null, url)),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { bold: true }, "Prompt: "),
            React.createElement(Text, { dimColor: true }, promptSummary))));
}
//# sourceMappingURL=WebFetchTool.js.map