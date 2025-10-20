---
sidebar_position: 4
---

# Roadmap

Agent Tracker is designed to eventually support multiple AI coding agents, not just Claude Code. This page outlines our vision for multi-agent support and future enhancements.

## Vision

**Make it easy to track and manage all your AI coding assistants in one unified dashboard.**

Whether you're using Claude Code, Cursor, Windsurf, Aider, or any other AI agent, Agent Tracker should provide a consistent, beautiful interface for monitoring your sessions.

## Multi-Agent Support

### Current Support

#### ✅ Claude Code (Full Support)

- Real-time session tracking via plugin hooks
- Activity monitoring (tool use, prompts, responses)
- Transcript viewing
- Rich context capture (git, terminal, docker)

### Planned Agent Support

#### 🔄 Cursor (Planned)

**Status:** In planning

**Approach:**
- Investigate Cursor's extension API
- Create event adapter for Cursor sessions
- Map Cursor events to Agent Tracker format

**Challenges:**
- Cursor uses VS Code extension model
- May need different integration approach than CLI hooks

#### 🔄 Windsurf (Planned)

**Status:** Research phase

**Approach:**
- Investigate Windsurf's architecture
- Determine event capture mechanism
- Create Windsurf-specific adapter

#### 🔄 Aider (Planned)

**Status:** Research phase

**Approach:**
- Aider is CLI-based, similar to Claude Code
- May be able to wrap Aider commands
- Capture events from Aider's output or config

**Potential:**
- Easier integration due to CLI nature
- Could be our second supported agent

#### 🔄 Continue.dev (Planned)

**Status:** Research phase

**Approach:**
- VS Code extension, similar challenges to Cursor
- Investigate Continue's API/events
- Create event adapter

#### 🔄 Cody (Planned)

**Status:** Research phase

**Approach:**
- Sourcegraph's AI assistant
- Multiple IDE support
- Research event capture options

### Integration Architecture

We're designing a flexible adapter pattern to support multiple agents:

```
┌─────────────────────────────────────────────────┐
│           Agent Tracker Core (TUI)              │
│  ┌───────────────────────────────────────────┐  │
│  │    Unified Event Stream                   │  │
│  │    (sessions.jsonl)                       │  │
│  └───────────────────────────────────────────┘  │
│                      ▲                           │
│                      │                           │
└──────────────────────┼───────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼──────┐    ┌─────▼─────┐    ┌──────▼──────┐
│  Claude  │    │  Cursor   │    │    Aider    │
│  Adapter │    │  Adapter  │    │   Adapter   │
└──────────┘    └───────────┘    └─────────────┘
```

Each adapter:
- Captures agent-specific events
- Transforms them to unified format
- Writes to `sessions.jsonl`
- Includes agent type identifier

### UI Enhancements for Multi-Agent

#### Agent Type Indicators

```
● agent-tracker (claude-code)
● my-app (cursor)
○ api-service (aider)
```

Sessions will show the agent type with distinct:
- Icons
- Colors
- Labels

#### Agent Filtering

Filter sessions by agent type:
- View all agents
- Show only Claude Code sessions
- Show only Cursor sessions
- etc.

#### Agent-Specific Help

The empty state and setup instructions will dynamically show the correct installation guide based on detected/selected agent.

## Feature Roadmap

### Near Term (Next 3 Months)

#### Enhanced iTerm2 Integration

**Status:** Planned ([Issue #28](https://github.com/wakeless/agent-tracker/issues))

Move iTerm2 API integration from hooks to TUI as persistent service:
- ✨ Faster session starts (50ms vs 400ms)
- ✨ Real-time tab name updates
- ✨ Richer metadata from Python API

#### Better Empty State UX

**Status:** In progress

- ✅ Check if events file exists
- ✅ Show installation guide
- 🔄 Detect available agents
- 🔄 Provide agent-specific setup instructions

#### Alerts & Notifications

**Status:** Planned

- Show alert for sessions awaiting input
- Highlight sessions that need attention
- Configurable notification preferences

### Medium Term (3-6 Months)

#### Multi-Agent Support (Phase 1)

- Add support for 2nd agent (likely Aider or Cursor)
- Implement agent adapter pattern
- Add agent type filtering in UI
- Test with users running multiple agents

#### Session Search & Filtering

- Search sessions by directory, git repo, or terminal
- Filter by session state
- Tag sessions manually

#### Session History & Analytics

- View historical sessions (beyond 1-minute retention)
- Session duration tracking
- Most active projects/repos

### Long Term (6+ Months)

#### Multi-Agent Support (Phase 2)

- Support for 5+ agents
- Agent-specific configuration
- Cross-agent session comparison

#### Cloud Sync (Optional)

- Optionally sync sessions to cloud
- View sessions across machines
- Team dashboards

#### LLM Integration

- Ask questions about your sessions
- "Which session was I working on the auth bug?"
- Summarize session activity

#### Workspace Management

- Group sessions by project/workspace
- Save and restore session layouts
- Integration with terminal multiplexers (tmux/screen)

## Terminal Support Roadmap

See [Terminal Support](./terminal-support#planned-terminal-support) for details on planned terminal emulator support:

- Alacritty
- Kitty
- WezTerm
- Windows Terminal
- Enhanced tmux/screen integration

## Contributing

We welcome contributions! Areas where help is needed:

### Research

- Investigate agent event capture mechanisms
- Test integration approaches
- Document agent architectures

### Development

- Build agent adapters
- Add terminal providers
- Improve TUI features

### Testing

- Test on different platforms
- Verify agent integrations
- Report bugs and edge cases

### Documentation

- Write integration guides
- Create tutorials
- Document troubleshooting steps

## Stay Updated

- ⭐ Star the [GitHub repo](https://github.com/wakeless/agent-tracker)
- 📝 Follow [GitHub Issues](https://github.com/wakeless/agent-tracker/issues) for updates
- 💬 Participate in [Discussions](https://github.com/wakeless/agent-tracker/discussions)

## Next Steps

- [Get started with Claude Code](./claude-code)
- [Learn about terminal support](./terminal-support)
- [Read the introduction](./intro)
