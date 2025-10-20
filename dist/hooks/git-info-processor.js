/**
 * Git Info Processor
 * Generates JSON output for git repository information
 * Replaces jq usage in git-info.sh
 */
import { createJsonOutput } from './json-utils.js';
/**
 * Convert string boolean to actual boolean
 * @param value - String 'true' or 'false'
 * @returns boolean value
 */
function stringToBoolean(value) {
    return value === 'true';
}
/**
 * Create git info JSON output
 * @param input - Git info data from shell script
 * @returns Compact JSON string
 */
export function createGitInfoJson(input) {
    const output = {
        is_repo: stringToBoolean(input.is_repo),
        branch: input.branch || 'unknown',
        is_worktree: stringToBoolean(input.is_worktree),
        is_dirty: stringToBoolean(input.is_dirty),
        repo_name: input.repo_name || 'unknown'
    };
    return createJsonOutput(output);
}
//# sourceMappingURL=git-info-processor.js.map