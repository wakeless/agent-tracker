import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { PlanReader, PlanFile, parsePlanMarkdown } from '@agent-tracker/core';

interface PlansListViewProps {
  selectedPlanFilename: string | null;
  onSelectPlan: (filename: string | null) => void;
  onViewPlan: (planFile: PlanFile, content: string) => void;
  onSwitchToSessions: () => void;
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
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Truncate text to fit in a specific width
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

export function PlansListView({
  selectedPlanFilename,
  onSelectPlan,
  onViewPlan,
  onSwitchToSessions,
}: PlansListViewProps) {
  const [plans, setPlans] = useState<PlanFile[]>([]);
  const [previewContent, setPreviewContent] = useState<string | null>(null);

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
    if (!previewContent) return null;
    return parsePlanMarkdown(previewContent);
  }, [previewContent]);

  // Keyboard navigation (Tab is handled globally in App.tsx)
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      // Navigate to previous plan
      const currentIdx = plans.findIndex((p) => p.filename === selectedPlanFilename);
      if (currentIdx > 0) {
        onSelectPlan(plans[currentIdx - 1].filename);
      }
    } else if (key.downArrow || input === 'j') {
      // Navigate to next plan
      const currentIdx = plans.findIndex((p) => p.filename === selectedPlanFilename);
      if (currentIdx >= 0 && currentIdx < plans.length - 1) {
        onSelectPlan(plans[currentIdx + 1].filename);
      }
    } else if (key.return && selectedPlanFilename && previewContent) {
      // Press Enter to view full plan
      const selectedPlan = plans.find((p) => p.filename === selectedPlanFilename);
      if (selectedPlan) {
        onViewPlan(selectedPlan, previewContent);
      }
    }
  });

  const selectedPlan = plans.find((p) => p.filename === selectedPlanFilename) || null;

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="magenta">
          Plan Explorer
        </Text>
        <Text dimColor> - Browse ~/.claude/plans/</Text>
      </Box>

      {/* Stats Bar */}
      <Box marginBottom={1}>
        <Box marginRight={2}>
          <Text>Total Plans: </Text>
          <Text bold>{plans.length}</Text>
        </Box>
        {selectedPlan && (
          <Box marginRight={2}>
            <Text dimColor>Selected: </Text>
            <Text>{truncate(selectedPlan.title, 40)}</Text>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box borderStyle="round" borderColor="gray" height={20}>
        {/* Left Panel - Plan List */}
        <Box flexDirection="column" width={40} borderStyle="single" borderColor="gray" padding={1}>
          {plans.length === 0 ? (
            <Text dimColor>No plans found</Text>
          ) : (
            plans.map((plan) => {
              const isSelected = plan.filename === selectedPlanFilename;
              return (
                <Box key={plan.filename}>
                  {isSelected ? (
                    <Text color="cyan" bold>
                      {'> '}
                    </Text>
                  ) : (
                    <Text>{'  '}</Text>
                  )}
                  <Text color={isSelected ? 'cyan' : undefined} bold={isSelected} wrap="truncate">
                    {truncate(plan.title, 30)}
                  </Text>
                  <Text dimColor> {formatDate(plan.modified)}</Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* Right Panel - Plan Preview */}
        <Box flexDirection="column" flexGrow={1} padding={1}>
          {selectedPlan && parsedPreview ? (
            <>
              {/* Plan Header */}
              <Box marginBottom={1}>
                <Text bold color="white">
                  {parsedPreview.title}
                </Text>
              </Box>
              <Box marginBottom={1}>
                <Text dimColor>
                  {selectedPlan.filename} • {formatSize(selectedPlan.size)} •{' '}
                  {formatDate(selectedPlan.modified)}
                </Text>
              </Box>

              {/* Section List */}
              <Box flexDirection="column">
                <Text bold dimColor>
                  Sections ({parsedPreview.sections.length}):
                </Text>
                {parsedPreview.sections.slice(0, 8).map((section, idx) => (
                  <Box key={section.id}>
                    <Text dimColor>{idx + 1}. </Text>
                    <Text wrap="truncate">{truncate(section.title, 50)}</Text>
                  </Box>
                ))}
                {parsedPreview.sections.length > 8 && (
                  <Text dimColor>... and {parsedPreview.sections.length - 8} more</Text>
                )}
              </Box>
            </>
          ) : (
            <Box>
              <Text dimColor>Select a plan to preview</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          Navigation: j/k • Enter: View plan • Tab: Cycle views • Quit: q or Ctrl+C
        </Text>
      </Box>
    </Box>
  );
}
