#!/usr/bin/env node
/**
 * Debug tool to show event timeline for a session or project
 *
 * Usage:
 *   npm run debug:timeline -- --session-id abc123
 *   npm run debug:timeline -- --cwd /path/to/project
 *   npm run debug:timeline -- --session-id abc123 --limit 20
 */

import * as fs from 'fs';
import { homedir } from 'os';
import { join } from 'path';

interface TimelineEvent {
  timestamp: string;
  eventType: string;
  sessionId: string;
  details?: string;
  cwd?: string;
}

interface TimelineOptions {
  sessionId?: string;
  cwd?: string;
  limit: number;
  format: 'table' | 'json';
}

function parseArgs(): TimelineOptions {
  const args = process.argv.slice(2);
  const options: TimelineOptions = {
    limit: 50,
    format: 'table',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--session-id' && i + 1 < args.length) {
      options.sessionId = args[++i];
    } else if (arg === '--cwd' && i + 1 < args.length) {
      options.cwd = args[++i];
    } else if (arg === '--limit' && i + 1 < args.length) {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === '--format' && i + 1 < args.length) {
      const format = args[++i];
      if (format === 'table' || format === 'json') {
        options.format = format;
      }
    }
  }

  return options;
}

function parseEvent(line: string): TimelineEvent | null {
  try {
    const event = JSON.parse(line);

    let eventType = event.event_type;
    let details = '';

    // Format event details
    if (event.event_type === 'activity') {
      eventType = event.activity_type;

      if (event.activity_type === 'tool_use') {
        details = event.tool_name || '';
      } else if (event.activity_type === 'notification') {
        details = event.notification_message || '';
      }
    } else if (event.event_type === 'work_summary_update') {
      details = event.summary || '';
    }

    return {
      timestamp: event.timestamp,
      eventType,
      sessionId: event.session_id,
      details,
      cwd: event.cwd,
    };
  } catch {
    return null;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toISOString().substring(11, 19); // HH:MM:SS
}

function formatTableRow(event: TimelineEvent, showSessionId: boolean): string {
  const time = formatTimestamp(event.timestamp);
  const sessionId = showSessionId ? event.sessionId.substring(0, 8) : '';
  const eventType = event.eventType.padEnd(20);
  const details = event.details || '';

  if (showSessionId) {
    return `${time}  ${sessionId}  ${eventType}  ${details}`;
  } else {
    return `${time}  ${eventType}  ${details}`;
  }
}

function main() {
  const options = parseArgs();
  const eventsFilePath = join(homedir(), '.agent-tracker', 'sessions.jsonl');

  if (!fs.existsSync(eventsFilePath)) {
    console.error(`Events file not found: ${eventsFilePath}`);
    process.exit(1);
  }

  // Read and parse events
  const content = fs.readFileSync(eventsFilePath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l);

  let events = lines
    .map(parseEvent)
    .filter((e): e is TimelineEvent => e !== null);

  // Filter by session ID
  if (options.sessionId) {
    events = events.filter(e => e.sessionId === options.sessionId);
  }

  // Filter by CWD
  if (options.cwd) {
    events = events.filter(e => e.cwd && e.cwd.includes(options.cwd!));
  }

  // Limit results (most recent first)
  events = events.slice(-options.limit);

  if (events.length === 0) {
    console.error('No events found matching criteria');
    process.exit(1);
  }

  // Output
  if (options.format === 'json') {
    console.log(JSON.stringify(events, null, 2));
  } else {
    // Table format
    const showSessionId = !options.sessionId; // Only show session ID if viewing multiple sessions

    console.log('');
    if (showSessionId) {
      console.log('Time      Session   Event Type            Details');
      console.log('────────  ────────  ────────────────────  ──────────────────────────────');
    } else {
      console.log('Time      Event Type            Details');
      console.log('────────  ────────────────────  ──────────────────────────────────');
    }

    events.forEach(event => {
      console.log(formatTableRow(event, showSessionId));
    });

    console.log('');
    console.log(`Showing ${events.length} most recent events`);
    if (options.sessionId) {
      console.log(`Session: ${options.sessionId}`);
    }
    if (options.cwd) {
      console.log(`CWD: ${options.cwd}`);
    }
  }

  process.exit(0);
}

main();
