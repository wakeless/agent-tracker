/**
 * Session Event Processor
 * Generates JSON output for session start and session end events
 * Replaces jq usage in session-start.sh and session-end.sh
 */
interface HookInput {
    session_id: string;
    cwd: string;
    transcript_path: string;
}
interface ITermInfo {
    session_id: string;
    profile: string;
    tab_name: string;
    window_name: string;
}
interface TerminalInfo {
    tty: string;
    term: string;
    shell: string;
    ppid: string;
    term_program: string;
    term_session_id: string;
    lc_terminal: string;
    lc_terminal_version: string;
    iterm: ITermInfo;
}
interface DockerInfo {
    is_container: boolean;
    container_id: string;
    container_name: string;
}
interface GitInfo {
    is_repo: boolean;
    branch: string;
    is_worktree: boolean;
    is_dirty: boolean;
    repo_name: string;
}
interface SessionEventInput {
    event_type: 'session_start' | 'session_end';
    session_id: string;
    cwd: string;
    transcript_path: string;
    terminal: TerminalInfo;
    docker: DockerInfo;
    git: GitInfo;
    timestamp: string;
}
/**
 * Parse Claude hook input JSON from stdin
 * @param input - JSON string from stdin
 * @returns Parsed hook data with defaults
 */
export declare function parseHookInput(input: string): HookInput;
/**
 * Create session event JSON output
 * @param input - Complete session event data
 * @returns Compact JSON string
 */
export declare function createSessionEventJson(input: SessionEventInput): string;
export {};
//# sourceMappingURL=session-processor.d.ts.map