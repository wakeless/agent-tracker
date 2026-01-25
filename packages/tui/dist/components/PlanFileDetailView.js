import React, { useReducer, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { parsePlanMarkdown } from '@agent-tracker/core';
import { PlanSectionComponent } from './tools/plan-viewer/index.js';
/**
 * Format file size for display
 */
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
/**
 * Format date for display
 */
function formatDate(date) {
    return date.toLocaleString();
}
function planViewerReducer(state, action) {
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
            }
            else {
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
export function PlanFileDetailView({ planFile, planContent, onBack }) {
    // Parse the plan markdown into sections
    const parsedPlan = useMemo(() => parsePlanMarkdown(planContent), [planContent]);
    const { title, sections } = parsedPlan;
    // Initialize state
    const [state, dispatch] = useReducer(planViewerReducer, {
        selectedIndex: 0,
        expandedSections: new Set(),
    });
    // Handle keyboard input
    useInput((input, key) => {
        if (key.upArrow || input === 'k') {
            dispatch({ type: 'NAVIGATE_UP' });
        }
        else if (key.downArrow || input === 'j') {
            dispatch({ type: 'NAVIGATE_DOWN', maxIndex: sections.length - 1 });
        }
        else if (key.return || input === ' ') {
            // Toggle current section
            const section = sections[state.selectedIndex];
            if (section) {
                dispatch({ type: 'TOGGLE_SECTION', sectionId: section.id });
            }
        }
        else if (input === 'e') {
            // Expand all
            dispatch({ type: 'EXPAND_ALL', sectionIds: sections.map((s) => s.id) });
        }
        else if (input === 'c') {
            // Collapse all
            dispatch({ type: 'COLLAPSE_ALL' });
        }
        else if (key.escape) {
            onBack();
        }
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { borderStyle: "round", borderColor: "magenta", paddingX: 1, marginBottom: 1, flexDirection: "column" },
            React.createElement(Text, { bold: true, color: "magenta" }, title),
            React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { dimColor: true }, "File: "),
                React.createElement(Text, null, planFile.filename)),
            React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Modified: "),
                React.createElement(Text, null, formatDate(planFile.modified)),
                React.createElement(Text, { dimColor: true }, " \u2022 Size: "),
                React.createElement(Text, null, formatSize(planFile.size)),
                React.createElement(Text, { dimColor: true }, " \u2022 Sections: "),
                React.createElement(Text, null, sections.length))),
        React.createElement(Box, { flexDirection: "column" }, sections.length === 0 ? (React.createElement(Text, { dimColor: true }, "No sections found in plan")) : (sections.map((section, index) => (React.createElement(Box, { key: section.id, marginBottom: state.expandedSections.has(section.id) ? 1 : 0 },
            React.createElement(PlanSectionComponent, { section: section, index: index, totalSections: sections.length, isSelected: index === state.selectedIndex, isExpanded: state.expandedSections.has(section.id) })))))),
        React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { dimColor: true }, "j/k: navigate  Enter/Space: toggle  e: expand all  c: collapse all  ESC: back to list"))));
}
//# sourceMappingURL=PlanFileDetailView.js.map