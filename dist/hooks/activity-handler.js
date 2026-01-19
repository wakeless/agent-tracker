#!/usr/bin/env node
/**
 * Activity Handler
 * Complete TypeScript implementation of activity hook logic
 * Replaces activity.sh bash script
 * Used by: PostToolUse, UserPromptSubmit, Stop, SubagentStop, Notification
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
// ============================================================================
// Activity Type Mapping
// ============================================================================
/**
 * Map hook event names to activity types
 */
function getActivityType(hookEventName) {
    const mapping = {
        'PostToolUse': 'tool_use',
        'UserPromptSubmit': 'prompt_submit',
        'Stop': 'stop',
        'SubagentStop': 'subagent_stop',
        'Notification': 'notification'
    };
    return mapping[hookEventName] || null;
}
// ============================================================================
// Main Handler
// ============================================================================
/**
 * Process activity event
 */
export function handleActivity(hookInput) {
    const hookEventName = hookInput.hook_event_name || 'unknown';
    const activityType = getActivityType(hookEventName);
    // Unknown hook type, skip
    if (!activityType) {
        return null;
    }
    const timestamp = new Date().toISOString();
    const event = {
        event_type: 'activity',
        activity_type: activityType,
        session_id: hookInput.session_id || 'unknown',
        timestamp,
        hook_event_name: hookEventName
    };
    // Add tool name for tool_use events
    if (activityType === 'tool_use' && hookInput.tool_name) {
        event.tool_name = hookInput.tool_name;
        // Include tool parameters if available
        if (hookInput.tool_input) {
            event.tool_input = hookInput.tool_input;
        }
    }
    // Add notification message for notification events
    if (activityType === 'notification' && hookInput.message) {
        event.notification_message = hookInput.message;
    }
    return event;
}
/**
 * Main entry point when run as CLI
 */
function main() {
    try {
        // Read hook input from stdin
        const input = fs.readFileSync(0, 'utf-8');
        const hookInput = JSON.parse(input);
        // Process the event
        const event = handleActivity(hookInput);
        // Skip unknown events
        if (!event) {
            process.exit(0);
        }
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
    }
    catch (error) {
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
//# sourceMappingURL=activity-handler.js.map