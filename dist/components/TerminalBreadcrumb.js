import React from 'react';
import { Box, Text } from 'ink';
import { parseITermSessionId } from '../utils/parseITermSessionId.js';
/**
 * Displays terminal location as a breadcrumb hierarchy
 *
 * For iTerm2:
 * - Parses session ID (w0t4p2:uuid) to show Window > Tab > Pane hierarchy
 * - Shows window name if available, otherwise "Window N"
 * - Shows tab name in hierarchy
 * - Displays profile as secondary info
 *
 * For other terminals:
 * - Shows terminal program, shell, and TTY
 */
export function TerminalBreadcrumb({ session }) {
    const isITerm = session.terminal.term_program === 'iTerm.app';
    if (isITerm) {
        return React.createElement(ITermBreadcrumb, { session: session });
    }
    return React.createElement(GenericTerminalBreadcrumb, { session: session });
}
function ITermBreadcrumb({ session }) {
    const sessionParts = parseITermSessionId(session.terminal.iterm.session_id);
    const hasWindowName = session.terminal.iterm.window_name !== 'unknown';
    const hasTabName = session.terminal.iterm.tab_name !== 'unknown';
    const hasProfile = session.terminal.iterm.profile !== 'unknown';
    // Build window part
    const windowPart = hasWindowName
        ? session.terminal.iterm.window_name
        : sessionParts.isValid
            ? `Window ${sessionParts.window}`
            : 'Unknown Window';
    // Build tab part
    const tabPart = hasTabName
        ? sessionParts.isValid
            ? `${session.terminal.iterm.tab_name} (Tab ${sessionParts.tab})`
            : session.terminal.iterm.tab_name
        : sessionParts.isValid
            ? `Tab ${sessionParts.tab}`
            : 'Unknown Tab';
    // Build pane part
    const panePart = sessionParts.isValid ? `Pane ${sessionParts.pane}` : 'Unknown Pane';
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "Terminal: "),
            React.createElement(Text, null, windowPart),
            React.createElement(Text, { dimColor: true }, " \u203A "),
            React.createElement(Text, null, tabPart),
            React.createElement(Text, { dimColor: true }, " \u203A "),
            React.createElement(Text, null, panePart)),
        hasProfile && (React.createElement(Box, { marginLeft: 10 },
            React.createElement(Text, { dimColor: true },
                "iTerm2 | ",
                session.terminal.iterm.profile)))));
}
function GenericTerminalBreadcrumb({ session }) {
    const termProgram = session.terminal.term_program || 'Terminal';
    const shell = session.terminal.shell.split('/').pop() || session.terminal.shell;
    const tty = session.terminal.tty;
    return (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
        React.createElement(Box, null,
            React.createElement(Text, { bold: true }, "Terminal: "),
            React.createElement(Text, null, termProgram),
            React.createElement(Text, { dimColor: true }, " | "),
            React.createElement(Text, null, shell),
            React.createElement(Text, { dimColor: true }, " | "),
            React.createElement(Text, null, tty))));
}
//# sourceMappingURL=TerminalBreadcrumb.js.map