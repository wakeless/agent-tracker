import React from 'react';
import { Box, Text } from 'ink';
import { getStableColor } from '../utils/stableColors.js';
export function SessionList({ sessions, selectedSessionId }) {
    if (sessions.length === 0) {
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Text, { dimColor: true }, "No active sessions"),
            React.createElement(Text, { dimColor: true }, "Start a Claude session to see it here")));
    }
    return (React.createElement(Box, { flexDirection: "column", padding: 1, width: "100%" },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, underline: true },
                "Sessions (",
                sessions.length,
                ")")),
        sessions.map((session) => (React.createElement(SessionListItem, { key: session.id, session: session, isSelected: session.id === selectedSessionId })))));
}
function SessionListItem({ session, isSelected }) {
    const getStatusColor = (status, awaitingInput) => {
        if (awaitingInput)
            return 'magenta';
        if (status === 'active')
            return 'green';
        if (status === 'inactive')
            return 'yellow';
        return 'gray';
    };
    const getStatusSymbol = (status, awaitingInput) => {
        if (awaitingInput)
            return '⏳';
        if (status === 'active')
            return '●';
        if (status === 'inactive')
            return '○';
        return '✕';
    };
    // Extract directory name from path
    const dirName = session.cwd.split('/').pop() || session.cwd;
    // Build project identifier from git info
    const getProjectParts = () => {
        if (session.git.is_repo && session.git.repo_name !== 'unknown') {
            return {
                repoName: session.git.repo_name,
                branch: session.git.branch,
            };
        }
        // Fall back to directory name for non-git projects
        return {
            repoName: dirName,
            branch: null,
        };
    };
    // Format time since last activity
    const timeSince = formatTimeSince(session.lastActivityTime);
    // Get iTerm-specific information if available
    const isITerm = session.terminal.term_program === 'iTerm.app';
    const tabName = isITerm && session.terminal.iterm.tab_name !== 'unknown'
        ? sanitizeDisplayText(session.terminal.iterm.tab_name)
        : null;
    // Get project parts for stable coloring
    const { repoName, branch } = getProjectParts();
    // Get stable colors for repo and branch (background + foreground)
    const repoColors = getStableColor(repoName);
    const branchColors = branch ? getStableColor(branch) : null;
    // Simplified secondary info: just show time since last activity
    const secondaryInfo = timeSince;
    return (React.createElement(Box, { width: "100%" },
        React.createElement(Box, { width: 2, flexShrink: 0 }, isSelected && (React.createElement(Text, { bold: true, color: "cyan" }, '> '))),
        React.createElement(Box, { flexDirection: "column", flexGrow: 1, minWidth: 0 },
            React.createElement(Box, { minWidth: 0 },
                React.createElement(Text, { bold: isSelected, color: isSelected ? 'cyan' : getStatusColor(session.status, session.awaitingInput), dimColor: session.status !== 'active' && !session.awaitingInput },
                    getStatusSymbol(session.status, session.awaitingInput),
                    ' '),
                React.createElement(Text, { bold: isSelected, backgroundColor: isSelected ? undefined : repoColors.backgroundColor, color: isSelected ? 'cyan' : repoColors.foregroundColor }, isSelected ? repoName : ` ${repoName} `),
                branch && branchColors && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { bold: isSelected, dimColor: true }, ":"),
                    React.createElement(Text, { bold: isSelected, backgroundColor: isSelected ? undefined : branchColors.backgroundColor, color: isSelected ? 'cyan' : branchColors.foregroundColor }, isSelected ? branch : ` ${branch} `))),
                tabName && (React.createElement(React.Fragment, null,
                    React.createElement(Text, { dimColor: true }, " \u2013 "),
                    React.createElement(Text, { dimColor: true }, tabName)))),
            React.createElement(Box, { marginLeft: 2, minWidth: 0 },
                React.createElement(Text, { dimColor: true, wrap: "truncate-end" }, secondaryInfo)))));
}
function formatTimeSince(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
function sanitizeDisplayText(text) {
    // Remove control characters (0x00-0x1F, 0x7F-0x9F)
    // Remove zero-width characters and other invisible Unicode characters
    return text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // ASCII/Extended control characters
        .replace(/[\u200B-\u200F]/g, "") // Zero-width spaces, joiners, etc.
        .replace(/[\uFEFF]/g, "") // Zero-width no-break space (BOM)
        .replace(/[\u2060-\u206F]/g, "") // Word joiner, invisible operators
        .trim();
}
//# sourceMappingURL=SessionList.js.map