import React from 'react';
import { Box, Text } from 'ink';
import { isExitPlanModeInput } from './ToolDisplayProps.js';
export function ExitPlanModeTool({ toolInput, mode }) {
    if (!isExitPlanModeInput(toolInput)) {
        return React.createElement(Text, { dimColor: true }, "Invalid ExitPlanMode input");
    }
    const { plan, allowedPrompts } = toolInput;
    // Extract title from first markdown heading
    const titleMatch = plan.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Plan';
    // Count sections for preview
    const sectionCount = (plan.match(/^##\s+/gm) || []).length;
    if (mode === 'collapsed') {
        return React.createElement(Text, { dimColor: true }, title);
    }
    // Expanded: show title and hint to explore
    return (React.createElement(Box, { flexDirection: "column" },
        React.createElement(Text, { bold: true }, title),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true },
                sectionCount,
                " section",
                sectionCount !== 1 ? 's' : '',
                allowedPrompts && allowedPrompts.length > 0
                    ? ` • ${allowedPrompts.length} permission${allowedPrompts.length !== 1 ? 's' : ''} requested`
                    : '')),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { color: "cyan" }, "Press Enter to explore plan \u2192"))));
}
//# sourceMappingURL=ExitPlanModeTool.js.map