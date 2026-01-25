import React from 'react';
import { Box, Text, useInput } from 'ink';
/**
 * Get status color and label for display
 */
function getStatus(status) {
    switch (status) {
        case 'in_progress':
            return { color: 'yellow', label: 'In Progress' };
        case 'completed':
            return { color: 'green', label: 'Completed' };
        default:
            return { color: 'gray', label: 'Pending' };
    }
}
/**
 * Truncate conversation ID for header
 */
function truncateId(id) {
    if (id.length <= 36)
        return id;
    return id.substring(0, 8) + '...' + id.substring(id.length - 8);
}
export function TaskDetailView({ task, conversationId, onBack }) {
    const status = getStatus(task.status);
    // Keyboard navigation
    useInput((input, key) => {
        if (key.escape || input === 'h' || input === 'q') {
            onBack();
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "yellow" },
                "Task #",
                task.id),
            React.createElement(Text, { dimColor: true },
                " - ",
                truncateId(conversationId))),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "white", wrap: "wrap" }, task.subject)),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray", padding: 1, marginBottom: 1 },
            React.createElement(Box, { flexDirection: "column" },
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true }, "Status: "),
                    React.createElement(Text, { color: status.color }, status.label)),
                task.activeForm && task.status === 'in_progress' && (React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true }, "Active Form: "),
                    React.createElement(Text, { color: "yellow" }, task.activeForm))),
                task.blockedBy.length > 0 && (React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true }, "Blocked By: "),
                    React.createElement(Text, { color: "red" }, task.blockedBy.join(', ')))),
                task.blocks.length > 0 && (React.createElement(Box, null,
                    React.createElement(Text, { bold: true }, "Blocks: "),
                    React.createElement(Text, { color: "blue" }, task.blocks.join(', ')))))),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray", padding: 1, flexDirection: "column", height: 12 },
            React.createElement(Box, { marginBottom: 1 },
                React.createElement(Text, { bold: true }, "Description")),
            React.createElement(Text, { wrap: "wrap" }, task.description || '(no description provided)')),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Press Esc or h to go back \u2022 q to quit"))));
}
//# sourceMappingURL=TaskDetailView.js.map