# Agent Tracker Instructions

This plugin provides tools to help track and communicate your work progress to users.

## set_work_summary Tool

Use the `set_work_summary` tool to communicate what you're currently working on to the Agent Tracker dashboard.

### When to Call

Call `set_work_summary` in these situations:

1. **Starting new work** - When you begin implementing a feature, fixing a bug, or starting any significant task
2. **Direction changes** - When the focus of work shifts significantly (e.g., from implementation to testing, from one feature to another)
3. **Major milestones** - When completing one phase and moving to the next

### How to Use

The tool accepts a single parameter:
- `summary` (string): A 5-word summary describing the current work

### Format Guidelines

- Use exactly **5 words**
- Use present continuous tense (e.g., "Implementing...", "Fixing...", "Refactoring...")
- Be specific and descriptive
- Focus on the "what" not the "how"

### Examples

**Good summaries:**
- "Implementing user authentication system"
- "Fixing database connection issues"
- "Refactoring payment processing code"
- "Adding dark mode support"
- "Testing API endpoint responses"
- "Updating session tracking logic"

**Avoid:**
- Too vague: "Working on code"
- Too detailed: "Implementing JWT token validation in AuthService class"
- Wrong tense: "Implemented user authentication" (use continuous: "Implementing")
- Too many words: "Working on implementing the new user authentication system"

### Usage Pattern

```typescript
// When starting new work
await mcp__agent_tracker__set_work_summary({
  summary: "Implementing user authentication system"
});

// When direction changes
await mcp__agent_tracker__set_work_summary({
  summary: "Testing authentication edge cases"
});
```

### Benefits

- Users can see what you're working on in real-time
- Provides context for long-running sessions
- Helps track progress across multiple tasks
- Makes it easier to resume work later

## Notes

- The summary is displayed in the Agent Tracker TUI dashboard
- Each call updates the current work summary for the session
- Summaries are captured via Claude Code's PostToolUse hook
- This is informational only - it doesn't affect your capabilities
