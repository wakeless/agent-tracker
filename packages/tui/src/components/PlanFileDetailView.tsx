import React, { useReducer, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { PlanFile, parsePlanMarkdown } from '@agent-tracker/core';
import { PlanSectionComponent } from './tools/plan-viewer/index.js';

interface PlanFileDetailViewProps {
  planFile: PlanFile;
  planContent: string;
  onBack: () => void;
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleString();
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

export function PlanFileDetailView({ planFile, planContent, onBack }: PlanFileDetailViewProps) {
  // Parse the plan markdown into sections
  const parsedPlan = useMemo(() => parsePlanMarkdown(planContent), [planContent]);
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
    } else if (key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* File Metadata Header */}
      <Box
        borderStyle="round"
        borderColor="magenta"
        paddingX={1}
        marginBottom={1}
        flexDirection="column"
      >
        <Text bold color="magenta">
          {title}
        </Text>
        <Box marginTop={1}>
          <Text dimColor>File: </Text>
          <Text>{planFile.filename}</Text>
        </Box>
        <Box>
          <Text dimColor>Modified: </Text>
          <Text>{formatDate(planFile.modified)}</Text>
          <Text dimColor> • Size: </Text>
          <Text>{formatSize(planFile.size)}</Text>
          <Text dimColor> • Sections: </Text>
          <Text>{sections.length}</Text>
        </Box>
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

      {/* Footer with help */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text dimColor>
          j/k: navigate  Enter/Space: toggle  e: expand all  c: collapse all  ESC: back to list
        </Text>
      </Box>
    </Box>
  );
}
