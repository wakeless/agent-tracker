#!/usr/bin/env node
/**
 * Session End Handler
 * Complete TypeScript implementation of session end hook logic
 * Replaces session-end.sh bash script
 */
interface HookInput {
    session_id: string;
    cwd: string;
    transcript_path: string;
    [key: string]: unknown;
}
interface SessionEndEvent {
    event_type: 'session_end';
    session_id: string;
    cwd: string;
    transcript_path: string;
    terminal: any;
    docker: any;
    git: any;
    timestamp: string;
}
/**
 * Process session end event
 * Reuses the same logic as session start but with different event type
 */
export declare function handleSessionEnd(hookInput: HookInput): SessionEndEvent;
export {};
//# sourceMappingURL=session-end-handler.d.ts.map