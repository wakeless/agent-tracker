import React from 'react';
import { Box, Text } from 'ink';
import { getRecentConversation } from '../utils/transcriptFilters.js';
import { TerminalBreadcrumb } from './TerminalBreadcrumb.js';
export function SessionDetail({ session, recentTranscript = [] }) {
    if (!session) {
        return (React.createElement(Box, { flexDirection: "column", padding: 1 },
            React.createElement(Text, { dimColor: true }, "No session selected")));
    }
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, underline: true }, "Session Details")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true }, "Status: "),
            React.createElement(StatusBadge, { status: session.status, awaitingInput: session.awaitingInput })),
        React.createElement(TerminalBreadcrumb, { session: session }),
        session.git.is_repo && session.git.repo_name !== 'unknown' && (React.createElement(DetailRow, { label: "Project", value: `${session.git.repo_name}:${session.git.branch}` })),
        React.createElement(DetailRow, { label: "Session ID", value: session.id }),
        React.createElement(DetailRow, { label: "Working Directory", value: session.cwd }),
        session.git.is_repo && (React.createElement(React.Fragment, null,
            React.createElement(Box, { marginTop: 1, marginBottom: 1 },
                React.createElement(Text, { bold: true, underline: true }, "Git Information")),
            session.git.repo_name !== 'unknown' && (React.createElement(DetailRow, { label: "Repository", value: session.git.repo_name })),
            React.createElement(DetailRow, { label: "Branch", value: `${session.git.branch}${session.git.is_worktree ? ' (worktree)' : ''}` }),
            React.createElement(DetailRow, { label: "Status", value: session.git.is_dirty ? 'Dirty (uncommitted changes)' : 'Clean' }))),
        React.createElement(Box, { marginTop: 1, marginBottom: 1 },
            React.createElement(Text, { bold: true, underline: true }, "Timestamps")),
        React.createElement(DetailRow, { label: "Started", value: formatDateTime(session.startTime) }),
        React.createElement(DetailRow, { label: "Last Activity", value: formatDateTime(session.lastActivityTime) }),
        session.endTime && (React.createElement(DetailRow, { label: "Ended", value: formatDateTime(session.endTime) })),
        recentTranscript.length > 0 && (React.createElement(React.Fragment, null,
            React.createElement(Box, { marginTop: 1, marginBottom: 1 },
                React.createElement(Text, { bold: true, underline: true }, "Recent Conversation")),
            getRecentConversation(recentTranscript, 5).map((entry, index) => {
                const maxLength = 80;
                const truncatedContent = entry.content.length > maxLength
                    ? entry.content.substring(0, maxLength) + '...'
                    : entry.content;
                const typeColor = entry.type === 'user' ? 'cyan' : entry.type === 'tool_use' ? 'yellow' : 'green';
                const typeLabel = entry.type === 'user' ? 'User' : entry.type === 'tool_use' ? entry.toolName || 'Tool' : 'Assistant';
                return (React.createElement(Box, { key: entry.uuid, minWidth: 0 },
                    React.createElement(Text, { dimColor: true }, formatActivityTime(entry.timestamp)),
                    React.createElement(Text, null, " "),
                    React.createElement(Text, { bold: true, color: typeColor },
                        "[",
                        typeLabel,
                        "]"),
                    React.createElement(Text, null, " "),
                    React.createElement(Text, { wrap: "truncate-end" }, truncatedContent)));
            }))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { bold: true }, "Transcript: "),
            React.createElement(Text, { dimColor: true }, session.transcriptPath)),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Press ENTER to view full transcript"))));
}
function DetailRow({ label, value }) {
    return (React.createElement(Box, null,
        React.createElement(Box, { width: 22 },
            React.createElement(Text, { dimColor: true },
                label,
                ":")),
        React.createElement(Text, null, value)));
}
function StatusBadge({ status, awaitingInput }) {
    const getColor = () => {
        if (awaitingInput)
            return 'magenta';
        if (status === 'active')
            return 'green';
        if (status === 'inactive')
            return 'yellow';
        return 'red';
    };
    const getSymbol = () => {
        if (awaitingInput)
            return '⏳ Awaiting Input';
        if (status === 'active')
            return '● Active';
        if (status === 'inactive')
            return '○ Inactive';
        return '✕ Ended';
    };
    return (React.createElement(Text, { bold: true, color: getColor() }, getSymbol()));
}
function formatDateTime(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        if (diffSeconds < 60) {
            return `${timeStr} (${diffSeconds}s ago)`;
        }
        else if (diffMinutes < 60) {
            return `${timeStr} (${diffMinutes}m ago)`;
        }
        else {
            return `${timeStr} (${diffHours}h ago)`;
        }
    }
    // Otherwise show date and time
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
function formatActivityTime(date) {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60)
        return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60)
        return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
}
//# sourceMappingURL=SessionDetail.js.map