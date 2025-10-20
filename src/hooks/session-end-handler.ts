#!/usr/bin/env node
/**
 * Session End Handler
 * Complete TypeScript implementation of session end hook logic
 * Replaces session-end.sh bash script
 */

import * as fs from 'fs';
import * as path from 'path';
import { handleSessionStart } from './session-start-handler.js';
import { fileURLToPath } from 'url';

// ============================================================================
// Types
// ============================================================================

interface HookInput {
  session_id: string;
  cwd: string;
  transcript_path: string;
  [key: string]: unknown;
}

interface SessionEndEvent {
  event_type: 'session_end';
  session_id: string;
  cwd: string;
  transcript_path: string;
  terminal: any;
  docker: any;
  git: any;
  timestamp: string;
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Process session end event
 * Reuses the same logic as session start but with different event type
 */
export function handleSessionEnd(hookInput: HookInput): SessionEndEvent {
  // Reuse session start logic to gather all the same information
  const event = handleSessionStart(hookInput);

  // Change event type to session_end
  return {
    ...event,
    event_type: 'session_end'
  };
}

/**
 * Main entry point when run as CLI
 */
function main() {
  try {
    // Read hook input from stdin
    const input = fs.readFileSync(0, 'utf-8');
    const hookInput = JSON.parse(input) as HookInput;

    // Process the event
    const event = handleSessionEnd(hookInput);

    // Output as compact JSON
    console.log(JSON.stringify(event));

    // Write to JSONL file
    const logDir = path.join(process.env.HOME || '/tmp', '.agent-tracker');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'sessions.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(event) + '\n');

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run main if executed directly (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main();
}
