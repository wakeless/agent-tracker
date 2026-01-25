import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { TaskReader } from '@agent-tracker/core';
/**
 * Format date for display
 */
function formatDate(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        }
        return `${hours}h ago`;
    }
    if (days === 1)
        return 'yesterday';
    if (days < 7)
        return `${days}d ago`;
    return date.toLocaleDateString();
}
/**
 * Truncate UUID for display
 */
function truncateId(id, maxLength = 8) {
    if (id.length <= maxLength)
        return id;
    return id.substring(0, maxLength) + '...';
}
/**
 * Get status color for display
 */
function getStatusColor(status) {
    switch (status) {
        case 'in_progress':
            return 'yellow';
        case 'completed':
            return 'green';
        default:
            return 'gray';
    }
}
/**
 * Get a preview of tasks from a conversation
 */
function getTaskPreview(reader, conversationId) {
    return reader.getTasksForConversation(conversationId).slice(0, 5);
}
export function TasksListView({ selectedConversationId, onSelectTaskSet, onViewTaskSet, onSwitchToSessions, }) {
    const [taskSets, setTaskSets] = useState([]);
    const [previewTasks, setPreviewTasks] = useState([]);
    // Load task sets on mount
    useEffect(() => {
        const reader = new TaskReader();
        const summaries = reader.scanTaskSets();
        setTaskSets(summaries);
        // Select first if none selected
        if (summaries.length > 0 && !selectedConversationId) {
            onSelectTaskSet(summaries[0].conversationId);
        }
    }, []);
    // Load preview for selected task set
    useEffect(() => {
        if (!selectedConversationId) {
            setPreviewTasks([]);
            return;
        }
        const reader = new TaskReader();
        const tasks = getTaskPreview(reader, selectedConversationId);
        setPreviewTasks(tasks);
    }, [selectedConversationId]);
    // Keyboard navigation
    useInput((input, key) => {
        if (key.upArrow || input === 'k') {
            const currentIdx = taskSets.findIndex((ts) => ts.conversationId === selectedConversationId);
            if (currentIdx > 0) {
                onSelectTaskSet(taskSets[currentIdx - 1].conversationId);
            }
        }
        else if (key.downArrow || input === 'j') {
            const currentIdx = taskSets.findIndex((ts) => ts.conversationId === selectedConversationId);
            if (currentIdx >= 0 && currentIdx < taskSets.length - 1) {
                onSelectTaskSet(taskSets[currentIdx + 1].conversationId);
            }
        }
        else if (key.return && selectedConversationId) {
            onViewTaskSet(selectedConversationId);
        }
        else if (key.tab || input === 't') {
            onSwitchToSessions();
        }
    });
    const selectedTaskSet = taskSets.find((ts) => ts.conversationId === selectedConversationId) || null;
    // Calculate totals
    const totals = useMemo(() => {
        let pending = 0;
        let inProgress = 0;
        let completed = 0;
        for (const ts of taskSets) {
            pending += ts.pending;
            inProgress += ts.inProgress;
            completed += ts.completed;
        }
        return { pending, inProgress, completed };
    }, [taskSets]);
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "yellow" }, "Task Explorer"),
            React.createElement(Text, { dimColor: true }, " - Browse ~/.claude/tasks/")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, null, "Conversations: "),
                React.createElement(Text, { bold: true }, taskSets.length)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Pending: "),
                React.createElement(Text, { color: "gray" }, totals.pending)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Active: "),
                React.createElement(Text, { color: "yellow" }, totals.inProgress)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Done: "),
                React.createElement(Text, { color: "green" }, totals.completed))),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray", height: 20 },
            React.createElement(Box, { flexDirection: "column", width: 45, borderStyle: "single", borderColor: "gray", padding: 1 }, taskSets.length === 0 ? (React.createElement(Text, { dimColor: true }, "No task sets found")) : (taskSets.map((ts) => {
                const isSelected = ts.conversationId === selectedConversationId;
                return (React.createElement(Box, { key: ts.conversationId },
                    isSelected ? (React.createElement(Text, { color: "cyan", bold: true }, '> ')) : (React.createElement(Text, null, '  ')),
                    React.createElement(Text, { color: isSelected ? 'cyan' : undefined, bold: isSelected }, truncateId(ts.conversationId, 12)),
                    React.createElement(Text, { dimColor: true }, " "),
                    React.createElement(Text, { color: "gray" },
                        ts.pending,
                        "p"),
                    React.createElement(Text, { dimColor: true }, "/"),
                    React.createElement(Text, { color: "yellow" },
                        ts.inProgress,
                        "a"),
                    React.createElement(Text, { dimColor: true }, "/"),
                    React.createElement(Text, { color: "green" },
                        ts.completed,
                        "d"),
                    React.createElement(Text, { dimColor: true },
                        " ",
                        formatDate(ts.lastModified))));
            }))),
            React.createElement(Box, { flexDirection: "column", flexGrow: 1, padding: 1 }, selectedTaskSet && previewTasks.length > 0 ? (React.createElement(React.Fragment, null,
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true, color: "white" },
                        selectedTaskSet.taskCount,
                        " Tasks")),
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { dimColor: true },
                        "Conversation: ",
                        selectedTaskSet.conversationId)),
                React.createElement(Box, { flexDirection: "column" },
                    React.createElement(Text, { bold: true, dimColor: true }, "Tasks:"),
                    previewTasks.map((task, idx) => (React.createElement(Box, { key: task.id },
                        React.createElement(Text, { dimColor: true },
                            "#",
                            task.id,
                            " "),
                        React.createElement(Text, { color: getStatusColor(task.status) }, task.status === 'in_progress' ? '*' : task.status === 'completed' ? '+' : ' '),
                        React.createElement(Text, null, " "),
                        React.createElement(Text, { wrap: "truncate" }, task.subject.substring(0, 40))))),
                    selectedTaskSet.taskCount > 5 && (React.createElement(Text, { dimColor: true },
                        "... and ",
                        selectedTaskSet.taskCount - 5,
                        " more"))))) : (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Select a task set to preview"))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Navigation: j/k \u2022 Enter: View tasks \u2022 Tab: Switch views \u2022 Quit: q or Ctrl+C"))));
}
//# sourceMappingURL=TasksListView.js.map