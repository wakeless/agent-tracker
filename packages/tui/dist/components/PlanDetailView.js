import React, { useReducer, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { parsePlanMarkdown } from './tools/plan-viewer/index.js';
import { PlanSectionComponent } from './tools/plan-viewer/index.js';
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
export function PlanDetailView({ plan, allowedPrompts }) {
    // Parse the plan markdown into sections
    const parsedPlan = useMemo(() => parsePlanMarkdown(plan), [plan]);
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
        // ESC is handled globally by App.tsx
    });
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 1, marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "cyan" }, title)),
        React.createElement(Box, { flexDirection: "column" }, sections.length === 0 ? (React.createElement(Text, { dimColor: true }, "No sections found in plan")) : (sections.map((section, index) => (React.createElement(Box, { key: section.id, marginBottom: state.expandedSections.has(section.id) ? 1 : 0 },
            React.createElement(PlanSectionComponent, { section: section, index: index, totalSections: sections.length, isSelected: index === state.selectedIndex, isExpanded: state.expandedSections.has(section.id) })))))),
        allowedPrompts && allowedPrompts.length > 0 && (React.createElement(Box, { flexDirection: "column", marginTop: 1 },
            React.createElement(Text, { bold: true }, "Requested Permissions:"),
            allowedPrompts.map((p, i) => (React.createElement(Text, { key: i, dimColor: true },
                '  ',
                "* ",
                p.tool,
                ": ",
                p.prompt))))),
        React.createElement(Box, { marginTop: 1, borderStyle: "single", borderColor: "gray", paddingX: 1 },
            React.createElement(Text, { dimColor: true }, "j/k: navigate  Enter: toggle  e: expand all  c: collapse all  ESC: back"))));
}
//# sourceMappingURL=PlanDetailView.js.map