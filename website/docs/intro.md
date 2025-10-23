---
sidebar_position: 1
---

# Getting Started

:::warning Alpha Software
Agent Tracker is currently in **alpha**. Features may change, and you might encounter bugs. Please [report issues](https://github.com/wakeless/agent-tracker/issues) if you find any!
:::

Welcome to **Agent Tracker**! A CLI TUI tool for tracking and monitoring active AI agent sessions in real-time.

## What is Agent Tracker?

Have you ever lost track of Claude Code windows? They get left in tabs, suspended with Ctrl+Z, or hidden in background terminals. Agent Tracker solves this by giving you a live dashboard of all your agent sessions.

## Features

- **Real-time Session Tracking**: Automatically detects when AI agent sessions start and end
- **Activity Monitoring**: Real-time tracking of tool usage, prompts, and agent responses
- **Smart Session States**: Distinguishes between active, inactive, and ended sessions based on actual activity
- **Visual Dashboard**: Beautiful 2-column TUI showing all your sessions
- **Rich Terminal Context**:
  - iTerm2 integration showing tab names, window names, and profiles
  - Docker container detection
  - Git repository information
  - Modular terminal provider system (easily extensible)
- **Session Details**: View working directory, terminal info, timestamps, and session metadata
- **Keyboard Navigation**: Vim-style navigation (j/k or arrow keys)

## Quick Start

### Installation

#### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g agent-tracker

# Run the TUI
agent-tracker
```

#### Option 2: Install from Source

```bash
# Clone the repository
git clone https://github.com/wakeless/agent-tracker.git
cd agent-tracker

# Install dependencies
npm install

# Build the project
npm run build

# Run the TUI
npm start
```

### Install the Plugin

Currently, Agent Tracker supports **Claude Code** through a plugin system. See the [Claude Code](./claude-code) page for detailed setup instructions.

### Usage

Once installed, run the Agent Tracker TUI:

```bash
agent-tracker
```

The dashboard will display:
- **Session List** (left panel): All tracked sessions with status indicators
- **Session Detail** (right panel): Details of the selected session
- **Stats Bar**: Counts of total, active, inactive, and ended sessions

### Command-Line Options

```bash
# Use default events file (~/.agent-tracker/sessions.jsonl)
agent-tracker

# Use a custom events file
agent-tracker --events-file /tmp/test-sessions.jsonl
agent-tracker -e /tmp/test-sessions.jsonl

# Show help
agent-tracker --help
```

### Keyboard Controls

- **↑/↓** or **j/k**: Navigate between sessions
- **Enter**: View session transcript
- **ESC**: Return to session list
- **q** or **Ctrl+C**: Quit

## Session States

Sessions automatically transition between states:

- **Active** (green ●): Session has had activity within the last 5 minutes
- **Inactive** (yellow ○): No activity for 5+ minutes but session hasn't ended
- **Awaiting Input** (magenta ⏳): Agent is waiting for user input
- **Ended** (gray ✕): Session has been terminated

## How It Works

Agent Tracker uses a plugin system to capture session and activity events:

1. **Plugins capture events** from agent sessions (start, end, tool usage, prompts)
2. **Terminal providers** extract context (iTerm tab names, profiles, etc.)
3. **Events stream** to `~/.agent-tracker/sessions.jsonl`
4. **TUI watches** the file and updates the display in real-time
5. **Smart states** track whether sessions are actively working or idle

## Next Steps

- [Set up Claude Code integration](./claude-code)
- [Learn about terminal support](./terminal-support)
- [See what's planned for the future](./roadmap)
