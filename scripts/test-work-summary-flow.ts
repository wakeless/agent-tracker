#!/usr/bin/env node
/**
 * Test script to verify work summary data flow
 * Simulates the TUI reading events and updating state using ActivityStore
 */

import * as fs from 'fs';
import * as path from 'path';
import { ActivityStore } from '../dist/services/ActivityStore.js';

// Create store instance
const store = new ActivityStore();

// Read events from sessions.jsonl
const logFile = path.join(process.env.HOME || '/tmp', '.agent-tracker', 'sessions.jsonl');
const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');

let workSummaryEvents = 0;

console.log('🔄 Simulating TUI data flow with ActivityStore...\n');

// Subscribe to state changes
store.subscribe(() => {
  // This fires on every state change, just like the TUI
});

for (const line of lines) {
  const event = JSON.parse(line);

  // Check for work summary MCP calls BEFORE dispatching
  if (
    event.event_type === 'activity' &&
    event.activity_type === 'tool_use' &&
    event.tool_name === 'mcp__plugin_agent-tracker_agent-tracker__set_work_summary' &&
    event.tool_input?.summary
  ) {
    console.log(`✅ Detected work summary event: "${event.tool_input.summary}"`);
    console.log(`   Session: ${event.session_id}`);
    console.log(`   Timestamp: ${event.timestamp}\n`);
    workSummaryEvents++;
  }

  // Dispatch to store (this is what SessionTrackerService does)
  if (event.event_type === 'session_start') {
    store.dispatch({ type: 'SESSION_START', payload: event });
  } else if (event.event_type === 'session_end') {
    store.dispatch({ type: 'SESSION_END', payload: event });
  } else if (event.event_type === 'activity') {
    // SessionTrackerService checks for MCP work summary calls
    if (
      event.activity_type === 'tool_use' &&
      event.tool_name === 'mcp__plugin_agent-tracker_agent-tracker__set_work_summary' &&
      event.tool_input?.summary
    ) {
      store.dispatch({
        type: 'UPDATE_WORK_SUMMARY',
        payload: {
          sessionId: event.session_id,
          summary: event.tool_input.summary
        }
      });
    }

    // Also dispatch the activity event
    switch (event.activity_type) {
      case 'tool_use':
        store.dispatch({ type: 'ACTIVITY_TOOL_USE', payload: event });
        break;
      case 'prompt_submit':
        store.dispatch({ type: 'ACTIVITY_PROMPT_SUBMIT', payload: event });
        break;
      case 'stop':
        store.dispatch({ type: 'ACTIVITY_STOP', payload: event });
        break;
      case 'notification':
        store.dispatch({ type: 'ACTIVITY_NOTIFICATION', payload: event });
        break;
    }
  }
}

console.log('═'.repeat(80));
console.log('FINAL STATE VERIFICATION');
console.log('═'.repeat(80));

const state = store.getState();
const sessions = state.sessions;

console.log(`Total sessions: ${sessions.size}`);
console.log(`Work summary events found: ${workSummaryEvents}\n`);

// Check each session
Array.from(sessions.values()).forEach(session => {
  console.log(`Session: ${session.id.substring(0, 8)}...`);
  console.log(`  CWD: ${session.cwd}`);
  console.log(`  Status: ${session.status}`);

  if (session.workSummary) {
    console.log(`  ✅ Work Summary: "${session.workSummary}"`);
  } else {
    console.log(`  ⚠️  No work summary`);
  }
  console.log('');
});

// Final check
const sessionsWithSummary = Array.from(sessions.values()).filter(s => s.workSummary);
console.log('═'.repeat(80));
console.log(`RESULT: ${sessionsWithSummary.length}/${sessions.size} sessions have work summaries`);
console.log('═'.repeat(80));

if (workSummaryEvents > 0 && sessionsWithSummary.length === 0) {
  console.error('\n❌ ERROR: Work summary events were found but no sessions have summaries!');
  console.error('   This indicates a bug in the reducer or action handling.');
  console.error('\n   Debugging steps:');
  console.error('   1. Check SessionTrackerService.ts is dispatching UPDATE_WORK_SUMMARY');
  console.error('   2. Check ActivityStore.ts reducer handles UPDATE_WORK_SUMMARY correctly');
  console.error('   3. Verify tool_name matches exactly');
  process.exit(1);
} else if (workSummaryEvents > 0) {
  console.log('\n✅ SUCCESS: Work summaries are flowing through the state correctly!');
  console.log('   When the TUI is running, SessionDetail should display these summaries.');
  console.log('\n   To verify in the TUI:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Select a session with a work summary');
  console.log('   3. Look for "Current Work:" in magenta italic text');
} else {
  console.log('\n⚠️  No work summary events found in the session log.');
  console.log('   Call set_work_summary in a Claude session to generate events.');
}
