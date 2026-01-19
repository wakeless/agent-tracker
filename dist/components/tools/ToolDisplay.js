import React from 'react';
import { TodoWriteTool } from './TodoWriteTool.js';
import { BashTool } from './BashTool.js';
import { EditTool } from './EditTool.js';
import { WriteTool } from './WriteTool.js';
import { ReadTool } from './ReadTool.js';
import { WebFetchTool } from './WebFetchTool.js';
import { ExitPlanModeTool } from './ExitPlanModeTool.js';
import { GrepTool } from './GrepTool.js';
import { GenericTool } from './GenericTool.js';
export function ToolDisplay(props) {
    const { toolName } = props;
    // Route to specific tool renderer based on tool name
    switch (toolName) {
        case 'TodoWrite':
            return React.createElement(TodoWriteTool, { ...props });
        case 'Bash':
            return React.createElement(BashTool, { ...props });
        case 'Edit':
            return React.createElement(EditTool, { ...props });
        case 'Read':
            return React.createElement(ReadTool, { ...props });
        case 'WebFetch':
            return React.createElement(WebFetchTool, { ...props });
        case 'ExitPlanMode':
            return React.createElement(ExitPlanModeTool, { ...props });
        case 'Write':
            return React.createElement(WriteTool, { ...props });
        case 'Grep':
            return React.createElement(GrepTool, { ...props });
        default:
            // Fallback to generic renderer for unknown tools
            return React.createElement(GenericTool, { ...props });
    }
}
//# sourceMappingURL=ToolDisplay.js.map