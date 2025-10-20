/**
 * Generic Terminal Provider Processor
 * Generates JSON output for generic terminal information
 * Replaces jq usage in generic.sh
 */
import { createJsonOutput } from './json-utils.js';
/**
 * Create generic terminal provider JSON output
 * @param input - Terminal session data
 * @returns Compact JSON string
 */
export function createGenericProviderJson(input) {
    const output = {
        session_id: input.session_id !== undefined ? input.session_id : 'unknown',
        profile: 'unknown',
        tab_name: 'unknown',
        window_name: 'unknown'
    };
    return createJsonOutput(output);
}
//# sourceMappingURL=generic-provider-processor.js.map