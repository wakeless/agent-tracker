import React from 'react';
import { TodoWriteTool } from './TodoWriteTool.js';
import { BashTool } from './BashTool.js';
import { EditTool } from './EditTool.js';
import { ReadTool } from './ReadTool.js';
import { WebFetchTool } from './WebFetchTool.js';
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
        // Add more tool renderers here as needed
        // case 'Glob':
        //   return <GlobTool {...props} />;
        // case 'Grep':
        //   return <GrepTool {...props} />;
        // case 'Write':
        //   return <WriteTool {...props} />;
        default:
            // Fallback to generic renderer for unknown tools
            return React.createElement(GenericTool, { ...props });
    }
}
//# sourceMappingURL=ToolDisplay.js.map