/**
 * ProjectScanner
 *
 * Scans ~/.claude/projects/ for session information by reading sessions-index.json files.
 * This enables "explore mode" - discovering Claude Code sessions without requiring hooks.
 *
 * Claude Code maintains a sessions-index.json file in each project directory with metadata:
 * - sessionId, fullPath (transcript path)
 * - firstPrompt, messageCount
 * - created, modified timestamps
 * - projectPath (working directory), gitBranch
 */
import { SessionStartEvent } from '../types/events.js';
/**
 * Entry from Claude Code's sessions-index.json
 */
export interface SessionIndexEntry {
    sessionId: string;
    fullPath: string;
    fileMtime: number;
    firstPrompt: string;
    messageCount: number;
    created: string;
    modified: string;
    projectPath: string;
    gitBranch: string;
    isSidechain: boolean;
}
export interface ProjectScannerOptions {
    claudeProjectsDir?: string;
    enableLogging?: boolean;
}
/**
 * ProjectScanner
 *
 * Scans Claude's projects directory to discover sessions without hooks.
 * Watches for changes to sessions-index.json files and transcript mtimes.
 */
export declare class ProjectScanner {
    private claudeProjectsDir;
    private enableLogging;
    private watchers;
    private pollInterval;
    private knownSessions;
    private onSessionDiscovered;
    private onSessionUpdated;
    constructor(options?: ProjectScannerOptions);
    private log;
    /**
     * Scan all sessions-index.json files and return entries
     */
    scanAllProjects(): SessionIndexEntry[];
    /**
     * Convert a session index entry to a synthetic SessionStartEvent
     */
    toSessionEvent(entry: SessionIndexEntry): SessionStartEvent;
    /**
     * Get transcript file mtime to determine activity
     */
    getTranscriptMtime(transcriptPath: string): Date | null;
    /**
     * Check if projects directory exists
     */
    projectsExist(): boolean;
    /**
     * Start watching for session changes
     */
    start(onSessionDiscovered: (event: SessionStartEvent) => void, onSessionUpdated: (sessionId: string, modified: Date) => void): void;
    /**
     * Rescan for new sessions
     */
    private rescan;
    /**
     * Check transcript file mtimes for activity detection
     */
    private checkTranscriptActivity;
    /**
     * Stop watching
     */
    stop(): void;
    /**
     * Get all known sessions
     */
    getKnownSessions(): SessionIndexEntry[];
}
//# sourceMappingURL=ProjectScanner.d.ts.map