import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { TaskReader } from '@agent-tracker/core';
/**
 * Get status indicator for display
 */
function getStatusIndicator(status) {
    switch (status) {
        case 'in_progress':
            return { symbol: '*', color: 'yellow' };
        case 'completed':
            return { symbol: '+', color: 'green' };
        default:
            return { symbol: ' ', color: 'gray' };
    }
}
/**
 * Get status label for display
 */
function getStatusLabel(status) {
    switch (status) {
        case 'in_progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        default:
            return 'Pending';
    }
}
/**
 * Truncate text to fit in a specific width
 */
function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 1) + '...';
}
export function TaskSetDetailView({ conversationId, selectedTaskId, onSelectTask, onViewTask, onBack, }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    // Load tasks on mount
    useEffect(() => {
        const reader = new TaskReader();
        const loadedTasks = reader.getTasksForConversation(conversationId);
        setTasks(loadedTasks);
        // Select first if none selected
        if (loadedTasks.length > 0 && !selectedTaskId) {
            onSelectTask(loadedTasks[0].id);
        }
    }, [conversationId]);
    // Update selected task when selection changes
    useEffect(() => {
        if (selectedTaskId) {
            const task = tasks.find((t) => t.id === selectedTaskId) || null;
            setSelectedTask(task);
        }
        else {
            setSelectedTask(null);
        }
    }, [selectedTaskId, tasks]);
    // Calculate task counts
    const counts = {
        pending: tasks.filter((t) => t.status === 'pending').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
    };
    // Keyboard navigation
    useInput((input, key) => {
        if (key.upArrow || input === 'k') {
            const currentIdx = tasks.findIndex((t) => t.id === selectedTaskId);
            if (currentIdx > 0) {
                onSelectTask(tasks[currentIdx - 1].id);
            }
        }
        else if (key.downArrow || input === 'j') {
            const currentIdx = tasks.findIndex((t) => t.id === selectedTaskId);
            if (currentIdx >= 0 && currentIdx < tasks.length - 1) {
                onSelectTask(tasks[currentIdx + 1].id);
            }
        }
        else if (key.return && selectedTask) {
            onViewTask(selectedTask);
        }
        else if (key.escape || input === 'h') {
            onBack();
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "yellow" }, "Task Set"),
            React.createElement(Text, { dimColor: true },
                " - ",
                truncate(conversationId, 36))),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, null, "Total: "),
                React.createElement(Text, { bold: true }, tasks.length)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Pending: "),
                React.createElement(Text, { color: "gray" }, counts.pending)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Active: "),
                React.createElement(Text, { color: "yellow" }, counts.inProgress)),
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Done: "),
                React.createElement(Text, { color: "green" }, counts.completed))),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray", height: 18 },
            React.createElement(Box, { flexDirection: "column", width: 45, borderStyle: "single", borderColor: "gray", padding: 1 }, tasks.length === 0 ? (React.createElement(Text, { dimColor: true }, "No tasks found")) : (tasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                const status = getStatusIndicator(task.status);
                return (React.createElement(Box, { key: task.id },
                    isSelected ? (React.createElement(Text, { color: "cyan", bold: true }, '> ')) : (React.createElement(Text, null, '  ')),
                    React.createElement(Text, { dimColor: true },
                        "#",
                        task.id,
                        " "),
                    React.createElement(Text, { color: status.color }, status.symbol),
                    React.createElement(Text, null, " "),
                    React.createElement(Text, { color: isSelected ? 'cyan' : undefined, bold: isSelected, wrap: "truncate" }, truncate(task.subject, 32))));
            }))),
            React.createElement(Box, { flexDirection: "column", flexGrow: 1, padding: 1 }, selectedTask ? (React.createElement(React.Fragment, null,
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true, color: "white" },
                        "#",
                        selectedTask.id,
                        ": ",
                        truncate(selectedTask.subject, 40))),
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { dimColor: true }, "Status: "),
                    React.createElement(Text, { color: getStatusIndicator(selectedTask.status).color }, getStatusLabel(selectedTask.status))),
                selectedTask.activeForm && selectedTask.status === 'in_progress' && (React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { dimColor: true }, "Active: "),
                    React.createElement(Text, { color: "yellow" }, selectedTask.activeForm))),
                (selectedTask.blocks.length > 0 || selectedTask.blockedBy.length > 0) && (React.createElement(Box, { flexDirection: "column", marginBottom: 1 },
                    selectedTask.blockedBy.length > 0 && (React.createElement(Box, null,
                        React.createElement(Text, { dimColor: true }, "Blocked by: "),
                        React.createElement(Text, { color: "red" }, selectedTask.blockedBy.join(', ')))),
                    selectedTask.blocks.length > 0 && (React.createElement(Box, null,
                        React.createElement(Text, { dimColor: true }, "Blocks: "),
                        React.createElement(Text, { color: "blue" }, selectedTask.blocks.join(', ')))))),
                React.createElement(Box, { flexDirection: "column" },
                    React.createElement(Text, { bold: true, dimColor: true }, "Description:"),
                    React.createElement(Text, { wrap: "wrap" }, truncate(selectedTask.description || '(no description)', 200))))) : (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Select a task to preview"))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Navigation: j/k \u2022 Enter: View task \u2022 Esc/h: Back \u2022 Quit: q or Ctrl+C"))));
}
//# sourceMappingURL=TaskSetDetailView.js.map