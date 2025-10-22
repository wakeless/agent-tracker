#!/usr/bin/env node
/**
 * Debug tool to dump current session state as JSON
 *
 * Usage:
 *   npm run debug:sessions
 *   npm run debug:sessions -- --session-id abc123
 *   npm run debug:sessions -- --format pretty
 */

import { SessionTrackerService } from '../src/services/SessionTrackerService.js';
import { homedir } from 'os';
import { join } from 'path';

interface DebugOptions {
  sessionId?: string;
  format: 'compact' | 'pretty';
  includeCounts: boolean;
  includeStats: boolean;
}

function parseArgs(): DebugOptions {
  const args = process.argv.slice(2);
  const options: DebugOptions = {
    format: 'pretty',
    includeCounts: true,
    includeStats: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--session-id' && i + 1 < args.length) {
      options.sessionId = args[++i];
    } else if (arg === '--format' && i + 1 < args.length) {
      const format = args[++i];
      if (format === 'compact' || format === 'pretty') {
        options.format = format;
      }
    } else if (arg === '--no-counts') {
      options.includeCounts = false;
    } else if (arg === '--no-stats') {
      options.includeStats = false;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const eventsFilePath = join(homedir(), '.agent-tracker', 'sessions.jsonl');

  // Create service and load sessions
  const service = new SessionTrackerService({
    eventsFilePath,
    enableLogging: false,
  });

  // Start service to load all events
  service.start();

  // Wait a moment for events to load
  await new Promise(resolve => setTimeout(resolve, 500));

  const output: any = {};

  // Get sessions
  if (options.sessionId) {
    // Single session
    const session = service.getSession(options.sessionId);
    if (!session) {
      console.error(`Session not found: ${options.sessionId}`);
      process.exit(1);
    }
    output.session = session;

    // Get activity for this session
    const activity = service.getSessionActivity(options.sessionId);
    output.recentActivity = activity;
  } else {
    // All sessions
    const sessions = service.getSessions();
    output.sessions = sessions;

    if (options.includeCounts) {
      output.sessionCounts = service.getSessionCounts();
    }

    if (options.includeStats) {
      output.stats = service.getStats();
    }

    // Recent activity across all sessions
    output.recentActivity = service.getRecentActivity(10);
  }

  // Output JSON
  const indent = options.format === 'pretty' ? 2 : 0;
  console.log(JSON.stringify(output, null, indent));

  service.stop();
  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
