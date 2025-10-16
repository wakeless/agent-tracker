# Agent Tracker

A CLI TUI tool for tracking active Claude Code sessions. Never lose track of your Claude windows again!

## Features

- **Real-time Session Tracking**: Automatically detects when Claude Code sessions start and end
- **Activity Monitoring**: Real-time tracking of tool usage, prompts, and Claude responses
- **Smart Session States**: Distinguishes between active, inactive, and ended sessions based on actual activity
- **Visual Dashboard**: Beautiful 2-column TUI showing all your Claude sessions
- **Rich Terminal Context**:
  - iTerm2 integration showing tab names, window names, and profiles
  - Docker container detection
  - Modular terminal provider system (easily extensible to other terminals)
- **Redux-Style State Management**: Predictable, type-safe state updates with pure reducers
- **Session Details**: View working directory, terminal info, timestamps, and session metadata
- **Keyboard Navigation**: Vim-style navigation (j/k or arrow keys)

## Problem

Have you ever lost track of Claude Code windows? They get left in tabs, suspended with Ctrl+Z, or hidden in background terminals. Agent Tracker solves this by giving you a live dashboard of all your Claude sessions.

## How It Works

Agent Tracker uses Claude Code's plugin system to capture session and activity events in real-time:

1. **Hooks capture events** from Claude sessions (start, end, tool usage, prompts)
2. **Terminal providers** extract context (iTerm tab names, profiles, etc.)
3. **Events stream** to `~/.agent-tracker/sessions.jsonl`
4. **TUI watches** the file and updates the display in real-time
5. **Smart states** track whether sessions are actively working or idle

For detailed technical architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Installation

### Option 1: Install from npm (Recommended)

```bash
# Install globally
npm install -g agent-tracker

# Run the TUI
agent-tracker
```

### Option 2: Install from Source

#### Step 1: Install Dependencies and Build

```bash
# Clone the repository
git clone https://github.com/yourusername/agent-tracker.git
cd agent-tracker

# Install dependencies
npm install

# Build the project
npm run build

# Run the TUI
npm start
```

### Step 2: Install the Claude Hooks Plugin

The plugin enables automatic session tracking by installing hooks that fire when Claude sessions start and end.

**From within this repository directory**, run these commands in Claude:

```bash
# Add this repository as a plugin marketplace
/plugin marketplace add .

# Install the agent-tracker plugin
/plugin install agent-tracker
```

**Important**: After installing the plugin, you need to **restart any running Claude sessions** (or start new ones) for the hooks to be active. The current session won't have the hooks loaded.

## Usage

### Start the Agent Tracker TUI

If installed globally:
```bash
agent-tracker
```

If running from source:
```bash
npm run dev
# or
npm start
```

### Test with Demo Repository

```bash
# Terminal 1: Start Agent Tracker
npm run dev

# Terminal 2: Start a test Claude session
npm run demo:session
# or manually:
cd demo-repo && claude
```

### Keyboard Controls

- **↑/↓** or **j/k**: Navigate between sessions
- **q** or **Ctrl+C**: Quit


## Session States

Sessions automatically transition between states based on real activity:

- **Active** (●): Session is running with recent activity from tools, prompts, or responses (green)
- **Inactive** (○): Session running but no activity for 5+ minutes (yellow)
- **Ended** (✕): Session has terminated (red, auto-removed after 1 minute)

Activity events that keep sessions "awake":
- Tool usage (Read, Write, Bash, Edit, etc.)
- User prompt submissions
- Claude response completions

## Development

For development setup, project structure, and architectural details, see:
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design patterns
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines for LLM agents
- **demo-repo/TESTING_WORKFLOW.md** - Testing procedures

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Quick Start Development

```bash
# Terminal 1: Build and run TUI
npm run build
npm run dev

# Terminal 2: Monitor events
tail -f ~/.agent-tracker/sessions.jsonl

# Terminal 3: Test with Claude
cd demo-repo && claude "list files"
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed development guide.

## Configuration

### Activity Store Configuration

The ActivityStore (Redux-style state management) can be configured with custom thresholds:

```typescript
const store = new ActivityStore({
  inactiveThresholdMs: 5 * 60 * 1000,  // 5 minutes (default)
  removeEndedSessionsMs: 60 * 1000,     // 1 minute (default)
  enableLogging: false,                 // Enable action logging for debugging
});
```

### Adding New Terminal Providers

To add support for a new terminal (e.g., Alacritty, Windows Terminal):

1. Copy `scripts/hooks/providers/template.sh` to `scripts/hooks/providers/your-terminal.sh`
2. Implement terminal detection and metadata extraction
3. Update `scripts/hooks/session-start.sh` and `session-end.sh` to call your provider
4. Test with your terminal

See `scripts/hooks/providers/README.md` for detailed instructions.

## Data Storage

Events are stored in `~/.agent-tracker/sessions.jsonl` in JSONL format:

### Session Start/End Events
```json
{
  "event_type": "session_start",
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "transcript_path": "/path/to/transcript.json",
  "terminal": {
    "tty": "/dev/ttys001",
    "term": "xterm-256color",
    "shell": "/bin/zsh",
    "ppid": "12345",
    "term_program": "iTerm.app",
    "term_session_id": "w0t4p1:abc123",
    "lc_terminal": "iTerm2",
    "lc_terminal_version": "3.5.14",
    "iterm": {
      "session_id": "w0t4p1:abc123",
      "profile": "Default",
      "tab_name": "My Tab Title",
      "window_name": "MacBook-Pro"
    }
  },
  "docker": {
    "is_container": false,
    "container_id": "unknown",
    "container_name": "unknown"
  },
  "timestamp": "2025-10-16T02:31:52Z"
}
```

### Activity Events
```json
{
  "event_type": "activity",
  "activity_type": "tool_use",
  "session_id": "abc123",
  "timestamp": "2025-10-16T02:32:15Z",
  "tool_name": "Read",
  "hook_event_name": "PostToolUse"
}
```

## Troubleshooting

### No sessions appearing

1. Check that the marketplace is added: `/plugin marketplace list`
2. Check that the plugin is installed: `/plugin list`
3. Check events are being written: `tail -f ~/.agent-tracker/sessions.jsonl`
4. Verify the plugin is enabled in `~/.claude/settings.json` under `enabledPlugins`

### Sessions not updating

- The TUI updates session states every 10 seconds
- File changes are detected in real-time via `fs.watch`
- Force a re-read by restarting the TUI

## Recent Enhancements

### Completed Features
- ✅ **Redux-style state management** - Predictable state updates with pure reducers
- ✅ **Real-time activity tracking** - PostToolUse, UserPromptSubmit, Stop hooks
- ✅ **Modular terminal providers** - Easy to extend for new terminals
- ✅ **iTerm2 integration** - Tab names, window names, profiles
- ✅ **Docker detection** - Container ID and name extraction
- ✅ **Smart session states** - Activity-based active/inactive detection
- ✅ **npm installable** - Global install with `npm install -g agent-tracker`

### Future Enhancements

- [ ] Activity timeline visualization
- [ ] Tool usage statistics and analytics
- [ ] Session persistence across TUI restarts
- [ ] Filter/search sessions
- [ ] Jump to session (open terminal at that location)
- [ ] Alert when sessions become inactive
- [ ] Support for Windows Terminal, Alacritty, Kitty providers
- [ ] Session history and time-series data

## Tech Stack

- TypeScript
- Ink (React for CLIs)
- Vitest (Testing)
- tsx (Development runner)

## License

MIT

## Contributing

Contributions welcome! Please see the beads issue tracker for planned work:

```bash
/beads:list
/beads:ready
```
