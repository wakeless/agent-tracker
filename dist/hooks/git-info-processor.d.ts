/**
 * Git Info Processor
 * Generates JSON output for git repository information
 * Replaces jq usage in git-info.sh
 */
interface GitInfoInput {
    is_repo?: string;
    branch?: string;
    is_worktree?: string;
    is_dirty?: string;
    repo_name?: string;
}
/**
 * Create git info JSON output
 * @param input - Git info data from shell script
 * @returns Compact JSON string
 */
export declare function createGitInfoJson(input: GitInfoInput): string;
export {};
//# sourceMappingURL=git-info-processor.d.ts.map