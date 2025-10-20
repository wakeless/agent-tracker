# Multi-Agent Support Tracking

This document tracks user-facing UI elements that are currently specific to Claude Code. When adding support for other AI agents (Cursor, Windsurf, Aider, etc.), these items will need to be updated to be agent-agnostic.

## Purpose

Agent Tracker is designed to eventually support multiple AI coding agents, not just Claude Code. This document identifies all the places where we've hardcoded "Claude Code" references in the user interface so they can be easily found and refactored when multi-agent support is implemented.

**Note**: Backend interfaces, types, and data structures are intentionally NOT tracked here - they will naturally evolve as we add support for other agents through proper abstraction patterns (adapters, providers, etc.).

## User-Facing Text to Update

### Application UI

**File**: `src/App.tsx`
- Line 235: Header subtitle "Tracking Claude Code Sessions"
  ```tsx
  <Text dimColor> - Tracking Claude Code Sessions</Text>
  ```
  → Should become: "Tracking AI Agent Sessions" or show active agent types

### Empty State / Onboarding

**File**: `src/components/EmptyState.tsx`
- Installation instructions reference Claude Code plugin specifically
- Should be updated to detect/support multiple agents or provide agent-specific instructions

### Session List

**File**: `src/components/SessionList.tsx`
- Line 15-16: Empty state message references "Claude session"
  ```tsx
  <Text dimColor>No active sessions</Text>
  <Text dimColor>Start a Claude session to see it here</Text>
  ```
  → Should become: "Start an AI agent session to see it here"

### Documentation

**File**: `README.md`
- Line 2: "A CLI TUI tool for tracking active Claude Code sessions"
- Line 6: "Real-time Session Tracking": Automatically detects when Claude Code sessions start and end"
- Line 19: "Have you ever lost track of Claude Code windows?"
- Line 24-25: "Agent Tracker uses Claude Code's plugin system..."
- Section headers and installation instructions are Claude Code-specific
- "How It Works" section describes Claude-specific hooks

**File**: `.claude-plugin/README.md`
- Entire document is Claude Code plugin documentation
- Should eventually have parallel documentation for other agents

**File**: `.claude-plugin/plugin.json`
- Line 4: Description "Tracks Claude Code sessions and displays them in a TUI dashboard"

**File**: `.claude-plugin/marketplace.json`
- Description field

### Package Metadata

**File**: `package.json`
- Line 4: Description "Real-time TUI dashboard for tracking and monitoring active Claude Code sessions"
- Line 31-32: Keywords include "claude" and "claude-code"
- Line 46: Homepage URL (may be Claude-specific or should be agent-agnostic)

### Demo/Testing

**File**: `demo-repo/README.md`
- References to Claude Code in testing instructions
- Example commands using `claude`

**File**: `demo-repo/TESTING_WORKFLOW.md`
- Test scenarios reference Claude sessions

**File**: `demo-repo/TEST_SCENARIOS.md`
- Scenarios reference Claude behavior

## Refactoring Strategy

When implementing multi-agent support:

1. **Agent Detection**: Identify which agent is running based on hook data or session metadata
2. **Dynamic Text**: Replace hardcoded "Claude Code" with dynamic agent name or generic "AI Agent"
3. **Agent Icons/Colors**: Add visual indicators for different agent types
4. **Filtering**: Allow users to filter sessions by agent type
5. **Agent-Specific Docs**: Provide installation guides for each supported agent

### Suggested Approach

- Add `agentType` field to Session interface (e.g., "claude-code", "cursor", "aider")
- Create agent-specific installation components that are conditionally rendered
- Update all static text to use template strings with agent names
- Add agent type badges/icons to session list items

## Future Agents to Support

Potential agents to add support for:
- **Cursor**: VS Code fork with AI integration
- **Windsurf**: AI coding assistant
- **Aider**: Command-line AI pair programmer
- **Continue**: VS Code extension for AI assistance
- **Cody**: Sourcegraph's AI assistant
- Others as the ecosystem evolves

## Notes

- Plugin system is Claude Code-specific (`.claude-plugin/`)
- Other agents will need their own integration mechanisms
- Core architecture (Redux state, event streaming, JSONL format) should work for any agent
- Terminal provider system is already agent-agnostic (good!)
