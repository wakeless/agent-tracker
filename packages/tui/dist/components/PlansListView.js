import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { PlanReader, parsePlanMarkdown } from '@agent-tracker/core';
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
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        }
        return `${hours}h ago`;
    }
    if (days === 1)
        return 'yesterday';
    if (days < 7)
        return `${days}d ago`;
    return date.toLocaleDateString();
}
/**
 * Truncate text to fit in a specific width
 */
function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 1) + '…';
}
export function PlansListView({ selectedPlanFilename, onSelectPlan, onViewPlan, onSwitchToSessions, }) {
    const [plans, setPlans] = useState([]);
    const [previewContent, setPreviewContent] = useState(null);
    // Load plans on mount
    useEffect(() => {
        const reader = new PlanReader();
        const planFiles = reader.scanPlans();
        setPlans(planFiles);
        // Select first plan if none selected
        if (planFiles.length > 0 && !selectedPlanFilename) {
            onSelectPlan(planFiles[0].filename);
        }
    }, []);
    // Load preview content for selected plan
    useEffect(() => {
        if (!selectedPlanFilename) {
            setPreviewContent(null);
            return;
        }
        const reader = new PlanReader();
        const content = reader.readPlan(selectedPlanFilename);
        setPreviewContent(content);
    }, [selectedPlanFilename]);
    // Parse preview content
    const parsedPreview = useMemo(() => {
        if (!previewContent)
            return null;
        return parsePlanMarkdown(previewContent);
    }, [previewContent]);
    // Keyboard navigation
    useInput((input, key) => {
        if (key.upArrow || input === 'k') {
            // Navigate to previous plan
            const currentIdx = plans.findIndex((p) => p.filename === selectedPlanFilename);
            if (currentIdx > 0) {
                onSelectPlan(plans[currentIdx - 1].filename);
            }
        }
        else if (key.downArrow || input === 'j') {
            // Navigate to next plan
            const currentIdx = plans.findIndex((p) => p.filename === selectedPlanFilename);
            if (currentIdx >= 0 && currentIdx < plans.length - 1) {
                onSelectPlan(plans[currentIdx + 1].filename);
            }
        }
        else if (key.return && selectedPlanFilename && previewContent) {
            // Press Enter to view full plan
            const selectedPlan = plans.find((p) => p.filename === selectedPlanFilename);
            if (selectedPlan) {
                onViewPlan(selectedPlan, previewContent);
            }
        }
        else if (key.tab || input === 't') {
            // Tab to switch back to sessions
            onSwitchToSessions();
        }
    });
    const selectedPlan = plans.find((p) => p.filename === selectedPlanFilename) || null;
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Text, { bold: true, color: "magenta" }, "Plan Explorer"),
            React.createElement(Text, { dimColor: true }, " - Browse ~/.claude/plans/")),
        React.createElement(Box, { marginBottom: 1 },
            React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, null, "Total Plans: "),
                React.createElement(Text, { bold: true }, plans.length)),
            selectedPlan && (React.createElement(Box, { marginRight: 2 },
                React.createElement(Text, { dimColor: true }, "Selected: "),
                React.createElement(Text, null, truncate(selectedPlan.title, 40))))),
        React.createElement(Box, { borderStyle: "round", borderColor: "gray", height: 20 },
            React.createElement(Box, { flexDirection: "column", width: 40, borderStyle: "single", borderColor: "gray", padding: 1 }, plans.length === 0 ? (React.createElement(Text, { dimColor: true }, "No plans found")) : (plans.map((plan) => {
                const isSelected = plan.filename === selectedPlanFilename;
                return (React.createElement(Box, { key: plan.filename },
                    isSelected ? (React.createElement(Text, { color: "cyan", bold: true }, '> ')) : (React.createElement(Text, null, '  ')),
                    React.createElement(Text, { color: isSelected ? 'cyan' : undefined, bold: isSelected, wrap: "truncate" }, truncate(plan.title, 30)),
                    React.createElement(Text, { dimColor: true },
                        " ",
                        formatDate(plan.modified))));
            }))),
            React.createElement(Box, { flexDirection: "column", flexGrow: 1, padding: 1 }, selectedPlan && parsedPreview ? (React.createElement(React.Fragment, null,
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { bold: true, color: "white" }, parsedPreview.title)),
                React.createElement(Box, { marginBottom: 1 },
                    React.createElement(Text, { dimColor: true },
                        selectedPlan.filename,
                        " \u2022 ",
                        formatSize(selectedPlan.size),
                        " \u2022",
                        ' ',
                        formatDate(selectedPlan.modified))),
                React.createElement(Box, { flexDirection: "column" },
                    React.createElement(Text, { bold: true, dimColor: true },
                        "Sections (",
                        parsedPreview.sections.length,
                        "):"),
                    parsedPreview.sections.slice(0, 8).map((section, idx) => (React.createElement(Box, { key: section.id },
                        React.createElement(Text, { dimColor: true },
                            idx + 1,
                            ". "),
                        React.createElement(Text, { wrap: "truncate" }, truncate(section.title, 50))))),
                    parsedPreview.sections.length > 8 && (React.createElement(Text, { dimColor: true },
                        "... and ",
                        parsedPreview.sections.length - 8,
                        " more"))))) : (React.createElement(Box, null,
                React.createElement(Text, { dimColor: true }, "Select a plan to preview"))))),
        React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true }, "Navigation: \u2191/\u2193 or j/k \u2022 Enter: View plan \u2022 Tab: Switch to Sessions \u2022 Quit: q or Ctrl+C"))));
}
//# sourceMappingURL=PlansListView.js.map