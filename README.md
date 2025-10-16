# Agent Tracker

A CLI TUI tool for tracking active Claude Code sessions. Never lose track of your Claude windows again!

## Features

- **Real-time Session Tracking**: Automatically detects when Claude Code sessions start and end
- **Visual Dashboard**: Beautiful 2-column TUI showing all your Claude sessions
- **Activity Monitoring**: Distinguishes between active, inactive, and ended sessions
- **Session Details**: View working directory, terminal info, and session metadata
- **Keyboard Navigation**: Vim-style navigation (j/k or arrow keys)

## Problem

Have you ever lost track of Claude Code windows? They get left in tabs, suspended with Ctrl+Z, or hidden in background terminals. Agent Tracker solves this by giving you a live dashboard of all your Claude sessions.

## Architecture

```
┌─────────────────┐
│ Claude Session  │
│   (Hooks)       │
└────────┬────────┘
         │ Session Events (JSONL)
         ▼
┌─────────────────┐
│  ~/.agent-      │
│  tracker/       │
│  sessions.jsonl │
└────────┬────────┘
         │ File Watch
         ▼
┌─────────────────┐
│  Agent Tracker  │
│     (TUI)       │
└─────────────────┘
```

## Installation

### Step 1: Install Dependencies and Build

```bash
# Install dependencies
npm install

# Build the project
npm run build
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

## How It Works

1. **Claude Hooks Plugin**: When Claude starts/ends, hooks write events to `~/.agent-tracker/sessions.jsonl`
2. **Event Watcher**: The TUI watches this file for changes in real-time
3. **Session Store**: Tracks session state (active/inactive/ended) and sorts by activity
4. **TUI Display**: Beautiful Ink-based interface shows all sessions with their details

## Session States

- **Active** (●): Session is running and recently active (green)
- **Inactive** (○): Session running but no activity for 5+ minutes (yellow)
- **Ended** (✕): Session has terminated (red, auto-removed after 1 minute)

## Development

### Project Structure

```
agent-tracker/
├── .claude-plugin/          # Claude Code plugin for hooks
│   ├── plugin.json
│   ├── hooks/
│   │   ├── hooks.json
│   │   ├── session-start.sh
│   │   └── session-end.sh
│   └── README.md
├── src/
│   ├── components/          # React components for TUI
│   │   ├── SessionList.tsx
│   │   └── SessionDetail.tsx
│   ├── services/            # Core business logic
│   │   ├── EventWatcher.ts
│   │   └── SessionStore.ts
│   ├── types/               # TypeScript interfaces
│   │   ├── events.ts
│   │   └── session.ts
│   ├── App.tsx              # Main TUI application
│   └── cli.tsx              # CLI entry point
├── demo-repo/               # Test directory for Claude sessions
│   ├── README.md
│   ├── TEST_SCENARIOS.md
│   └── TESTING_WORKFLOW.md
└── scripts/
    └── test-session.sh      # Helper script for testing
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Testing Workflow (TDD Loop)

1. Make changes to code
2. `npm run build`
3. In one terminal: `npm run dev`
4. In another terminal: `cd demo-repo && claude`
5. Observe the tracker behavior
6. Iterate

See `demo-repo/TESTING_WORKFLOW.md` for detailed testing instructions.

## Configuration

The SessionStore can be configured with custom thresholds:

```typescript
const store = new SessionStore({
  inactiveThresholdMs: 5 * 60 * 1000, // 5 minutes (default)
  removeEndedSessionsMs: 60 * 1000,    // 1 minute (default)
});
```

## Data Storage

Events are stored in `~/.agent-tracker/sessions.jsonl` in JSONL format:

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
    "term_session_id": "unique-id"
  },
  "timestamp": "2025-10-16T02:31:52Z"
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

## Future Enhancements

- [ ] Session persistence across TUI restarts
- [ ] Filter/search sessions
- [ ] Jump to session (open terminal at that location)
- [ ] Session history and statistics
- [ ] Alert when sessions become inactive
- [ ] Support for multiple user configurations

## Tech Stack

- TypeScript
- Ink (React for CLIs)
- Vitest (Testing)
- tsx (Development runner)

## License

ISC

## Contributing

Contributions welcome! Please see the beads issue tracker for planned work:

```bash
/beads:list
/beads:ready
```
