/**
 * Activity Event Processor
 * Generates JSON output for activity events
 * Replaces jq usage in activity.sh
 */
import { createJsonOutput } from './json-utils.js';
/**
 * Create activity event JSON output
 * @param input - Activity event data from shell script
 * @returns Compact JSON string
 */
export function createActivityEventJson(input) {
    const output = {
        event_type: 'activity',
        activity_type: input.activity_type,
        session_id: input.session_id,
        timestamp: input.timestamp,
        tool_name: input.tool_name || 'unknown',
        notification_message: input.notification_message || 'unknown',
        hook_event_name: input.hook_event_name || 'unknown'
    };
    return createJsonOutput(output);
}
//# sourceMappingURL=activity-processor.js.map