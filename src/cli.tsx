#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let eventsFilePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--events-file' || args[i] === '-e') {
      eventsFilePath = args[i + 1];
      i++; // Skip next argument
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Agent Tracker - Track and monitor AI agent sessions

Usage:
  agent-tracker [options]

Options:
  --events-file, -e <path>   Path to events file (default: ~/.agent-tracker/sessions.jsonl)
  --help, -h                 Show this help message

Examples:
  agent-tracker                                    # Use default events file
  agent-tracker -e /tmp/test-sessions.jsonl        # Use custom events file
`);
      process.exit(0);
    }
  }

  return { eventsFilePath };
}

const { eventsFilePath } = parseArgs();

// Set terminal title
process.stdout.write('\x1b]0;Agent Tracker\x07');

// Render the app
render(<App eventsFilePath={eventsFilePath} />);
