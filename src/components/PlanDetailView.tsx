import React, { useReducer, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { parsePlanMarkdown, PlanSection } from './tools/plan-viewer/index.js';
import { PlanSectionComponent } from './tools/plan-viewer/index.js';

interface PlanDetailViewProps {
  plan: string;
  allowedPrompts?: Array<{
    tool: string;
    prompt: string;
  }>;
}

// State for the plan viewer
interface PlanViewerState {
  selectedIndex: number;
  expandedSections: Set<string>;
}

type PlanViewerAction =
  | { type: 'NAVIGATE_UP' }
  | { type: 'NAVIGATE_DOWN'; maxIndex: number }
  | { type: 'TOGGLE_SECTION'; sectionId: string }
  | { type: 'EXPAND_ALL'; sectionIds: string[] }
  | { type: 'COLLAPSE_ALL' };

function planViewerReducer(state: PlanViewerState, action: PlanViewerAction): PlanViewerState {
  switch (action.type) {
    case 'NAVIGATE_UP':
      return {
        ...state,
        selectedIndex: Math.max(0, state.selectedIndex - 1),
      };

    case 'NAVIGATE_DOWN':
      return {
        ...state,
        selectedIndex: Math.min(action.maxIndex, state.selectedIndex + 1),
      };

    case 'TOGGLE_SECTION': {
      const newExpanded = new Set(state.expandedSections);
      if (newExpanded.has(action.sectionId)) {
        newExpanded.delete(action.sectionId);
      } else {
        newExpanded.add(action.sectionId);
      }
      return {
        ...state,
        expandedSections: newExpanded,
      };
    }

    case 'EXPAND_ALL':
      return {
        ...state,
        expandedSections: new Set(action.sectionIds),
      };

    case 'COLLAPSE_ALL':
      return {
        ...state,
        expandedSections: new Set(),
      };

    default:
      return state;
  }
}

export function PlanDetailView({ plan, allowedPrompts }: PlanDetailViewProps) {
  // Parse the plan markdown into sections
  const parsedPlan = useMemo(() => parsePlanMarkdown(plan), [plan]);
  const { title, sections } = parsedPlan;

  // Initialize state
  const [state, dispatch] = useReducer(planViewerReducer, {
    selectedIndex: 0,
    expandedSections: new Set<string>(),
  });

  // Handle keyboard input
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      dispatch({ type: 'NAVIGATE_UP' });
    } else if (key.downArrow || input === 'j') {
      dispatch({ type: 'NAVIGATE_DOWN', maxIndex: sections.length - 1 });
    } else if (key.return || input === ' ') {
      // Toggle current section
      const section = sections[state.selectedIndex];
      if (section) {
        dispatch({ type: 'TOGGLE_SECTION', sectionId: section.id });
      }
    } else if (input === 'e') {
      // Expand all
      dispatch({ type: 'EXPAND_ALL', sectionIds: sections.map((s) => s.id) });
    } else if (input === 'c') {
      // Collapse all
      dispatch({ type: 'COLLAPSE_ALL' });
    }
    // ESC is handled globally by App.tsx
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box
        borderStyle="single"
        borderColor="cyan"
        paddingX={1}
        marginBottom={1}
      >
        <Text bold color="cyan">
          {title}
        </Text>
      </Box>

      {/* Sections */}
      <Box flexDirection="column">
        {sections.length === 0 ? (
          <Text dimColor>No sections found in plan</Text>
        ) : (
          sections.map((section, index) => (
            <Box key={section.id} marginBottom={state.expandedSections.has(section.id) ? 1 : 0}>
              <PlanSectionComponent
                section={section}
                index={index}
                totalSections={sections.length}
                isSelected={index === state.selectedIndex}
                isExpanded={state.expandedSections.has(section.id)}
              />
            </Box>
          ))
        )}
      </Box>

      {/* Allowed Prompts */}
      {allowedPrompts && allowedPrompts.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Requested Permissions:</Text>
          {allowedPrompts.map((p, i) => (
            <Text key={i} dimColor>
              {'  '}* {p.tool}: {p.prompt}
            </Text>
          ))}
        </Box>
      )}

      {/* Footer with help */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          j/k: navigate  Enter: toggle  e: expand all  c: collapse all  ESC: back
        </Text>
      </Box>
    </Box>
  );
}
