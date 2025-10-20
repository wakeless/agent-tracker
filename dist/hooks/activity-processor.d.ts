/**
 * Activity Event Processor
 * Generates JSON output for activity events
 * Replaces jq usage in activity.sh
 */
interface ActivityEventInput {
    activity_type: string;
    session_id: string;
    timestamp: string;
    tool_name?: string;
    notification_message?: string;
    hook_event_name?: string;
}
/**
 * Create activity event JSON output
 * @param input - Activity event data from shell script
 * @returns Compact JSON string
 */
export declare function createActivityEventJson(input: ActivityEventInput): string;
export {};
//# sourceMappingURL=activity-processor.d.ts.map