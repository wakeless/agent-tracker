import React from 'react';
import { ToolDisplayProps } from './ToolDisplayProps.js';
import { TodoWriteTool } from './TodoWriteTool.js';
import { BashTool } from './BashTool.js';
import { EditTool } from './EditTool.js';
import { WriteTool } from './WriteTool.js';
import { ReadTool } from './ReadTool.js';
import { WebFetchTool } from './WebFetchTool.js';
import { ExitPlanModeTool } from './ExitPlanModeTool.js';
import { GrepTool } from './GrepTool.js';
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

    case 'ExitPlanMode':
      return <ExitPlanModeTool {...props} />;

    case 'Write':
      return <WriteTool {...props} />;

    case 'Grep':
      return <GrepTool {...props} />;

    default:
      // Fallback to generic renderer for unknown tools
      return <GenericTool {...props} />;
  }
}
