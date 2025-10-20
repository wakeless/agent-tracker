---
sidebar_position: 4
---

# Roadmap

Agent Tracker is designed to support multiple AI coding agents. This page outlines our current support and planned features.

## Current Support

### ✅ Claude Code (Full Support)

- Real-time session tracking via plugin hooks
- Activity monitoring (tool use, prompts, responses)
- Transcript viewing
- Rich context capture (git, terminal, docker)

## Planned Agent Support

### 🔄 AMP (Planned)

**Status:** Planning

**Approach:**
- Investigate AMP's event capture mechanism
- Create event adapter for AMP sessions
- Map AMP events to Agent Tracker format

### 🔄 Gemini CLI (Planned)

**Status:** Planning

**Approach:**
- CLI-based integration, similar to Claude Code
- Capture events from Gemini CLI output or hooks
- Transform to unified event format

### 🔄 Codex CLI (Planned)

**Status:** Planning

**Approach:**
- CLI-based integration
- Wrap Codex commands or capture via hooks
- Adapt events to Agent Tracker format

## Integration Architecture

Agent Tracker uses a flexible adapter pattern:

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
│  Claude  │    │    AMP    │    │   Gemini    │
│  Adapter │    │  Adapter  │    │   Adapter   │
└──────────┘    └───────────┘    └─────────────┘
```

Each adapter:
- Captures agent-specific events
- Transforms them to unified format
- Writes to `sessions.jsonl`
- Includes agent type identifier

## Contributing

We welcome contributions! Help us build agent adapters, improve the TUI, or enhance documentation.

- ⭐ Star the [GitHub repo](https://github.com/wakeless/agent-tracker)
- 📝 Follow [GitHub Issues](https://github.com/wakeless/agent-tracker/issues)

## Next Steps

- [Get started with Claude Code](./claude-code)
- [Learn about terminal support](./terminal-support)
- [Read the introduction](./intro)
