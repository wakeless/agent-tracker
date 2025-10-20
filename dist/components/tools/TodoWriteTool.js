import React from 'react';
import { Box, Text } from 'ink';
import { isTodoWriteInput } from './ToolDisplayProps.js';
export function TodoWriteTool({ toolInput, mode }) {
    if (!isTodoWriteInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid TodoWrite input");
    }
    const { todos } = toolInput;
    if (mode === 'collapsed') {
        // Count by status
        const completed = todos.filter((t) => t.status === 'completed').length;
        const inProgress = todos.filter((t) => t.status === 'in_progress').length;
        const pending = todos.filter((t) => t.status === 'pending').length;
        const parts = [];
        if (completed > 0)
            parts.push(`${completed} done`);
        if (inProgress > 0)
            parts.push(`${inProgress} in progress`);
        if (pending > 0)
            parts.push(`${pending} pending`);
        return (React.createElement(Text, null,
            "Updated todos (",
            todos.length,
            " task",
            todos.length !== 1 ? 's' : '',
            ": ",
            parts.join(', '),
            ")"));
    }
    // Expanded mode - show full checklist
    return (React.createElement(Box, { flexDirection: "column" }, todos.map((todo) => {
        const icon = todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '◐' : '○';
        const color = todo.status === 'completed' ? 'green' : todo.status === 'in_progress' ? 'yellow' : 'gray';
        return (React.createElement(Box, { key: todo.content },
            React.createElement(Text, { color: color },
                icon,
                " "),
            React.createElement(Text, { color: todo.status === 'completed' ? 'green' : undefined }, todo.content)));
    })));
}
//# sourceMappingURL=TodoWriteTool.js.map