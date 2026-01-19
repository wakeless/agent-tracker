#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
// Parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--help' || args[i] === '-h') {
            console.log(`
Agent Tracker - Track and monitor AI agent sessions

Usage:
  agent-tracker [options]

Options:
  --help, -h    Show this help message

Agent Tracker discovers sessions from ~/.claude/projects/ automatically.
No plugin installation required.
`);
            process.exit(0);
        }
    }
    return {};
}
parseArgs();
// Set terminal title
process.stdout.write('\x1b]0;Agent Tracker\x07');
// Render the app
render(React.createElement(App, null));
//# sourceMappingURL=cli.js.map