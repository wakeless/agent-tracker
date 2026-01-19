// Force chalk to use colors BEFORE importing marked-terminal
// marked-terminal uses chalk internally, and chalk checks this env var on import
if (!process.env.FORCE_COLOR) {
    process.env.FORCE_COLOR = '3'; // Force truecolor support
}
import React, { useMemo } from 'react';
import { Text } from 'ink';
import { marked } from 'marked';
import markedTerminal from 'marked-terminal';
import chalk from 'chalk';
/**
 * Renders markdown text in the terminal using marked and marked-terminal.
 * Converts markdown to ANSI formatted text that Ink can display.
 */
export function MarkdownText({ children }) {
    const rendered = useMemo(() => {
        if (!children || children.trim() === '') {
            return '';
        }
        try {
            // Ensure chalk is in color mode
            chalk.level = 3; // Force truecolor
            // Configure marked to use terminal renderer
            marked.setOptions({
                // @ts-expect-error - marked-terminal types may not be fully compatible
                renderer: new markedTerminal({
                    // Disable emojis for cleaner output
                    emoji: false,
                    // Use single line breaks
                    reflowText: true,
                    // Configure code block width
                    width: 100,
                }),
            });
            // Parse and render the markdown
            const result = marked.parse(children, { async: false });
            // Remove trailing newlines for cleaner output
            return result.trimEnd();
        }
        catch (error) {
            // If markdown parsing fails, return the original text
            console.error('Error rendering markdown:', error);
            return children;
        }
    }, [children]);
    return React.createElement(Text, null, rendered);
}
//# sourceMappingURL=MarkdownText.js.map