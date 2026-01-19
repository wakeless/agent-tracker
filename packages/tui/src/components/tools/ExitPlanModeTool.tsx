import React from 'react';
import { Box, Text } from 'ink';
import { ToolDisplayProps, isExitPlanModeInput } from './ToolDisplayProps.js';

export function ExitPlanModeTool({ toolInput, mode }: ToolDisplayProps) {
  if (!isExitPlanModeInput(toolInput)) {
    return <Text dimColor>Invalid ExitPlanMode input</Text>;
  }

  const { plan, allowedPrompts } = toolInput;

  // Extract title from first markdown heading
  const titleMatch = plan.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Plan';

  // Count sections for preview
  const sectionCount = (plan.match(/^##\s+/gm) || []).length;

  if (mode === 'collapsed') {
    return <Text dimColor>{title}</Text>;
  }

  // Expanded: show title and hint to explore
  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Box marginTop={1}>
        <Text dimColor>
          {sectionCount} section{sectionCount !== 1 ? 's' : ''}
          {allowedPrompts && allowedPrompts.length > 0
            ? ` • ${allowedPrompts.length} permission${allowedPrompts.length !== 1 ? 's' : ''} requested`
            : ''}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="cyan">Press Enter to explore plan →</Text>
      </Box>
    </Box>
  );
}
