/**
 * Terminal-specific information from terminal providers.
 * Currently supports iTerm2, with a generic fallback for other terminals.
 *
 * Terminal providers are modular scripts in scripts/hooks/providers/
 * that extract terminal-specific metadata. See providers/README.md for details.
 */
export interface ITermInfo {
    session_id: string;
    profile: string;
    tab_name: string;
    window_name: string;
}
export interface DockerInfo {
    is_container: boolean;
    container_id: string;
    container_name: string;
}
/**
 * Git repository information captured by hook scripts.
 * Provides context about the git repo state at session start/end.
 */
export interface GitInfo {
    is_repo: boolean;
    branch: string;
    is_worktree: boolean;
    is_dirty: boolean;
    repo_name: string;
}
/**
 * Terminal information captured by hook scripts.
 * The `iterm` field contains terminal-specific data from the active provider.
 *
 * Future terminal providers can be added by:
 * 1. Creating a new provider script (e.g., scripts/hooks/providers/alacritty.sh)
 * 2. Adding detection logic to session-start.sh and session-end.sh
 * 3. Optionally extending this interface with new provider-specific fields
 */
export interface TerminalInfo {
    tty: string;
    term: string;
    shell: string;
    pid?: string;
    ppid: string;
    term_program: string;
    term_session_id: string;
    lc_terminal: string;
    lc_terminal_version: string;
    /** Terminal-specific metadata from the active provider (iTerm2, generic, etc.) */
    iterm: ITermInfo;
}
export interface TranscriptFileInfo {
    birthtime: string;
    mtime: string;
    size: number;
}
export interface BaseEvent {
    event_type: 'session_start' | 'session_end';
    session_id: string;
    cwd: string;
    transcript_path: string;
    terminal: TerminalInfo;
    docker: DockerInfo;
    git: GitInfo;
    timestamp: string;
}
export interface SessionStartEvent extends BaseEvent {
    event_type: 'session_start';
    transcript_file?: TranscriptFileInfo;
}
export interface SessionEndEvent extends BaseEvent {
    event_type: 'session_end';
}
/**
 * Activity event from Claude Code activity hooks
 * Tracks tool usage, prompts, and other session activity
 */
export interface ActivityEvent {
    event_type: 'activity';
    activity_type: 'tool_use' | 'prompt_submit' | 'stop' | 'subagent_stop' | 'notification';
    session_id: string;
    timestamp: string;
    tool_name?: string;
    tool_input?: Record<string, unknown>;
    notification_message?: string;
    hook_event_name?: string;
}
export type SessionEvent = SessionStartEvent | SessionEndEvent | ActivityEvent;
export interface EventHandler {
    onSessionStart: (event: SessionStartEvent) => void;
    onSessionEnd: (event: SessionEndEvent) => void;
    onActivity?: (event: ActivityEvent) => void;
    onError?: (error: Error) => void;
}
//# sourceMappingURL=events.d.ts.map