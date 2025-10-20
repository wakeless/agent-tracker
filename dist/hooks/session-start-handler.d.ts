#!/usr/bin/env node
/**
 * Session Start Handler
 * Complete TypeScript implementation of session start hook logic
 * Replaces session-start.sh bash script
 */
interface HookInput {
    session_id: string;
    cwd: string;
    transcript_path: string;
    [key: string]: unknown;
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
    iterm: {
        session_id: string;
        profile: string;
        tab_name: string;
        window_name: string;
    };
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
interface SessionStartEvent {
    event_type: 'session_start';
    session_id: string;
    cwd: string;
    transcript_path: string;
    terminal: TerminalInfo;
    docker: DockerInfo;
    git: GitInfo;
    timestamp: string;
}
/**
 * Process session start event
 */
export declare function handleSessionStart(hookInput: HookInput): SessionStartEvent;
export {};
//# sourceMappingURL=session-start-handler.d.ts.map