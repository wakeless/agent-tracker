/**
 * Session Event Processor
 * Generates JSON output for session start and session end events
 * Replaces jq usage in session-start.sh and session-end.sh
 */
import { createJsonOutput, parseJsonInput, extractField } from './json-utils.js';
/**
 * Parse Claude hook input JSON from stdin
 * @param input - JSON string from stdin
 * @returns Parsed hook data with defaults
 */
export function parseHookInput(input) {
    const data = parseJsonInput(input);
    return {
        session_id: extractField(data, 'session_id', 'unknown'),
        cwd: extractField(data, 'cwd', 'unknown'),
        transcript_path: extractField(data, 'transcript_path', 'unknown')
    };
}
/**
 * Create session event JSON output
 * @param input - Complete session event data
 * @returns Compact JSON string
 */
export function createSessionEventJson(input) {
    // The input is already structured correctly, just convert to JSON
    return createJsonOutput(input);
}
//# sourceMappingURL=session-processor.js.map