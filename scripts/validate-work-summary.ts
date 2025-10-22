#!/usr/bin/env node
/**
 * Validation script for work summary MCP integration
 *
 * This script:
 * 1. Reads events from sessions.jsonl
 * 2. Simulates the ActivityStore/SessionTrackerService logic
 * 3. Validates that work summaries are captured correctly
 * 4. Reports on the state of sessions
 *
 * Usage:
 *   npm run validate:work-summary
 *   npm run validate:work-summary -- --session <session-id>
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

interface BaseEvent {
  event_type: string;
  session_id: string;
  timestamp: string;
}

interface SessionStartEvent extends BaseEvent {
  event_type: 'session_start';
  cwd: string;
  transcript_path: string;
}

interface SessionEndEvent extends BaseEvent {
  event_type: 'session_end';
}

interface ActivityEvent extends BaseEvent {
  event_type: 'activity';
  activity_type: string;
  tool_name?: string;
  tool_input?: {
    summary?: string;
    [key: string]: unknown;
  };
}

type Event = SessionStartEvent | SessionEndEvent | ActivityEvent;

interface SessionState {
  id: string;
  cwd: string;
  transcriptPath: string;
  startTime: Date;
  endTime?: Date;
  workSummary?: string;
  workSummaryHistory: Array<{ timestamp: Date; summary: string }>;
  activityCount: number;
  mcpToolCallCount: number;
}

// ============================================================================
// Event Processing
// ============================================================================

function processEvents(events: Event[]): Map<string, SessionState> {
  const sessions = new Map<string, SessionState>();

  for (const event of events) {
    const sessionId = event.session_id;

    // Handle session_start
    if (event.event_type === 'session_start') {
      const startEvent = event as SessionStartEvent;
      sessions.set(sessionId, {
        id: sessionId,
        cwd: startEvent.cwd,
        transcriptPath: startEvent.transcript_path,
        startTime: new Date(event.timestamp),
        workSummaryHistory: [],
        activityCount: 0,
        mcpToolCallCount: 0,
      });
      continue;
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      // Create minimal session if we see events before session_start
      session = {
        id: sessionId,
        cwd: 'unknown',
        transcriptPath: 'unknown',
        startTime: new Date(event.timestamp),
        workSummaryHistory: [],
        activityCount: 0,
        mcpToolCallCount: 0,
      };
      sessions.set(sessionId, session);
    }

    // Handle session_end
    if (event.event_type === 'session_end') {
      session.endTime = new Date(event.timestamp);
      continue;
    }

    // Handle activity events
    if (event.event_type === 'activity') {
      const activityEvent = event as ActivityEvent;
      session.activityCount++;

      // Check for work summary MCP tool calls
      if (
        activityEvent.activity_type === 'tool_use' &&
        activityEvent.tool_name === 'mcp__plugin_agent-tracker_agent-tracker__set_work_summary'
      ) {
        session.mcpToolCallCount++;

        if (activityEvent.tool_input?.summary) {
          const summary = activityEvent.tool_input.summary;
          session.workSummary = summary;
          session.workSummaryHistory.push({
            timestamp: new Date(event.timestamp),
            summary,
          });
        }
      }
    }
  }

  return sessions;
}

// ============================================================================
// Reporting
// ============================================================================

function formatDuration(start: Date, end?: Date): string {
  const endTime = end || new Date();
  const diffMs = endTime.getTime() - start.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  }
  return `${diffMinutes}m`;
}

function reportSession(session: SessionState, verbose: boolean = false): void {
  const status = session.endTime ? '✕ Ended' : '✓ Active';
  const duration = formatDuration(session.startTime, session.endTime);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Session: ${session.id}`);
  console.log(`Status: ${status} | Duration: ${duration}`);
  console.log(`Working Directory: ${session.cwd}`);
  console.log(`Transcript: ${session.transcriptPath}`);
  console.log(`Activity Events: ${session.activityCount} | MCP Calls: ${session.mcpToolCallCount}`);

  if (session.workSummary) {
    console.log(`\n✅ Current Work Summary: "${session.workSummary}"`);
  } else {
    console.log(`\n⚠️  No work summary set`);
  }

  if (verbose && session.workSummaryHistory.length > 0) {
    console.log(`\nWork Summary History (${session.workSummaryHistory.length} updates):`);
    session.workSummaryHistory.forEach((entry, index) => {
      const time = entry.timestamp.toLocaleTimeString();
      console.log(`  ${index + 1}. [${time}] "${entry.summary}"`);
    });
  }
}

function reportSummary(sessions: Map<string, SessionState>): void {
  const activeSessions = Array.from(sessions.values()).filter(s => !s.endTime);
  const endedSessions = Array.from(sessions.values()).filter(s => s.endTime);
  const sessionsWithSummary = Array.from(sessions.values()).filter(s => s.workSummary);
  const totalMcpCalls = Array.from(sessions.values()).reduce(
    (sum, s) => sum + s.mcpToolCallCount,
    0
  );

  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Sessions: ${sessions.size}`);
  console.log(`  Active: ${activeSessions.length}`);
  console.log(`  Ended: ${endedSessions.length}`);
  console.log(`Sessions with Work Summary: ${sessionsWithSummary.length} (${Math.round(sessionsWithSummary.length / sessions.size * 100)}%)`);
  console.log(`Total MCP set_work_summary calls: ${totalMcpCalls}`);

  if (totalMcpCalls === 0) {
    console.log(`\n⚠️  WARNING: No MCP tool calls detected!`);
    console.log(`   This could mean:`);
    console.log(`   1. The plugin instructions are not being followed`);
    console.log(`   2. The MCP server is not installed correctly`);
    console.log(`   3. The PostToolUse hook is not capturing tool_input`);
  }
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const sessionFilter = args.includes('--session')
    ? args[args.indexOf('--session') + 1]
    : null;
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Read events from sessions.jsonl
  const logFile = path.join(process.env.HOME || '/tmp', '.agent-tracker', 'sessions.jsonl');

  if (!fs.existsSync(logFile)) {
    console.error(`❌ Error: ${logFile} does not exist`);
    console.error(`   Run Claude Code to generate session events first.`);
    process.exit(1);
  }

  const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
  const events: Event[] = lines
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as Event);

  console.log(`📊 Loaded ${events.length} events from ${logFile}`);

  // Process events
  const sessions = processEvents(events);

  // Report
  if (sessionFilter) {
    const session = sessions.get(sessionFilter);
    if (!session) {
      console.error(`❌ Session not found: ${sessionFilter}`);
      process.exit(1);
    }
    reportSession(session, true);
  } else {
    // Report all sessions
    Array.from(sessions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .forEach(session => reportSession(session, verbose));

    reportSummary(sessions);
  }
}

main();
