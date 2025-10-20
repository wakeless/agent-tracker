import React from 'react';
import { ToolDisplayProps } from './ToolDisplayProps.js';
import { TodoWriteTool } from './TodoWriteTool.js';
import { BashTool } from './BashTool.js';
import { EditTool } from './EditTool.js';
import { ReadTool } from './ReadTool.js';
import { WebFetchTool } from './WebFetchTool.js';
import { GenericTool } from './GenericTool.js';

export function ToolDisplay(props: ToolDisplayProps) {
  const { toolName } = props;

  // Route to specific tool renderer based on tool name
  switch (toolName) {
    case 'TodoWrite':
      return <TodoWriteTool {...props} />;

    case 'Bash':
      return <BashTool {...props} />;

    case 'Edit':
      return <EditTool {...props} />;

    case 'Read':
      return <ReadTool {...props} />;

    case 'WebFetch':
      return <WebFetchTool {...props} />;

    // Add more tool renderers here as needed
    // case 'Glob':
    //   return <GlobTool {...props} />;
    // case 'Grep':
    //   return <GrepTool {...props} />;
    // case 'Write':
    //   return <WriteTool {...props} />;

    default:
      // Fallback to generic renderer for unknown tools
      return <GenericTool {...props} />;
  }
}
