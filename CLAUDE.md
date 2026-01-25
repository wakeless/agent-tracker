This is a TypeScript CLI TUI written using Ink (React for CLIs).

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. See AGENTS.md for workflow details.

## Quick Start: Debugging

If you're debugging Agent Tracker issues (sessions not showing, incorrect states, etc.), use the debug skill:

```bash
/debug-agent-tracker
```

## Development Guidelines

As an LLM agent working on this project:

1. **Complete Work**: Do not finish until your TODO list or acceptance criteria are complete
2. **TDD Loop**: Work iteratively with Test-Driven Development
3. **Feedback Loop**: Always create and utilize feedback loops to ensure code is workable
4. **Architecture**: Follow the patterns documented in [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Redux pattern for state management
   - Provider pattern for terminal detection
   - Event-driven architecture
   - Type-safe discriminated unions

## Design Philosophy

This is a critical set of design rules:
- **ALWAYS** use single directional flow of data
- Rarely use `useEffect` - this is prone to errors and if we are writing declaratively is unnecessary
- Do not over-optimize. If we need to optimize with stable functions or state, comment as to why

## Component-Specific Guidelines

Each component has its own CLAUDE.md with specific guidelines:

- **[scripts/hooks/CLAUDE.md](./scripts/hooks/CLAUDE.md)** - Hook scripts, backwards compatibility rules, JSONL format
- **[src/CLAUDE.md](./src/CLAUDE.md)** - TUI (Ink/React) development, state management
- **[packages/web/CLAUDE.md](./packages/web/CLAUDE.md)** - Web dashboard development

## Technical Reference

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full system architecture, design patterns, and extension points
- **[README.md](./README.md)** - User-facing documentation and features
- **[scripts/hooks/providers/README.md](./scripts/hooks/providers/README.md)** - Terminal provider system
- **[MULTI-AGENT.md](./MULTI-AGENT.md)** - Multi-agent support tracking

## Testing Workflow

1. Terminal 1: Start the Agent Tracker TUI
   ```bash
   npm run dev
   ```

2. Terminal 2: Monitor the event log
   ```bash
   tail -f ~/.agent-tracker/sessions.jsonl
   ```

3. Terminal 3: Start a test Claude session
   ```bash
   cd demo-repo && claude "list files in this directory"
   ```

You should see the session appear in the TUI and events logged in terminal 2.
