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

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { SessionStartEvent, TerminalInfo, GitInfo } from '../types/events.js';

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

/**
 * Session index file structure
 */
interface SessionIndexFile {
  version: number;
  entries: SessionIndexEntry[];
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
export class ProjectScanner {
  private claudeProjectsDir: string;
  private enableLogging: boolean;
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  private knownSessions: Map<string, SessionIndexEntry> = new Map();
  private onSessionDiscovered: ((event: SessionStartEvent) => void) | null = null;
  private onSessionUpdated: ((sessionId: string, modified: Date) => void) | null = null;

  constructor(options: ProjectScannerOptions = {}) {
    this.claudeProjectsDir = options.claudeProjectsDir || path.join(homedir(), '.claude', 'projects');
    this.enableLogging = options.enableLogging ?? false;
  }

  private log(...args: unknown[]): void {
    if (this.enableLogging) {
      console.log('[ProjectScanner]', ...args);
    }
  }

  /**
   * Scan all sessions-index.json files and return entries
   */
  scanAllProjects(): SessionIndexEntry[] {
    const entries: SessionIndexEntry[] = [];

    if (!fs.existsSync(this.claudeProjectsDir)) {
      this.log('Projects directory does not exist:', this.claudeProjectsDir);
      return entries;
    }

    try {
      const projectDirs = fs.readdirSync(this.claudeProjectsDir, { withFileTypes: true });

      for (const dirent of projectDirs) {
        if (!dirent.isDirectory()) continue;

        const indexPath = path.join(this.claudeProjectsDir, dirent.name, 'sessions-index.json');

        if (fs.existsSync(indexPath)) {
          try {
            const content = fs.readFileSync(indexPath, 'utf-8');
            const indexFile: SessionIndexFile = JSON.parse(content);

            if (indexFile.entries && Array.isArray(indexFile.entries)) {
              for (const entry of indexFile.entries) {
                // Skip sidechains by default
                if (entry.isSidechain) continue;
                entries.push(entry);
              }
            }
          } catch (err) {
            this.log('Error reading index file:', indexPath, err);
          }
        }
      }
    } catch (err) {
      this.log('Error scanning projects directory:', err);
    }

    this.log(`Found ${entries.length} sessions`);
    return entries;
  }

  /**
   * Convert a session index entry to a synthetic SessionStartEvent
   */
  toSessionEvent(entry: SessionIndexEntry): SessionStartEvent {
    // Create minimal terminal info (we don't have this from the index)
    const terminal: TerminalInfo = {
      tty: '',
      term: '',
      shell: '',
      ppid: '',
      term_program: '',
      term_session_id: '',
      lc_terminal: '',
      lc_terminal_version: '',
      iterm: {
        session_id: '',
        profile: '',
        tab_name: '',
        window_name: '',
      },
    };

    // Create git info from the index data
    const git: GitInfo = {
      is_repo: !!entry.gitBranch,
      branch: entry.gitBranch || '',
      is_worktree: false,
      is_dirty: false,
      repo_name: '',
    };

    // Truncate firstPrompt for display name
    const displayName = entry.firstPrompt
      ? entry.firstPrompt.length > 60
        ? entry.firstPrompt.substring(0, 57) + '...'
        : entry.firstPrompt
      : 'No prompt';

    return {
      event_type: 'session_start',
      session_id: entry.sessionId,
      cwd: entry.projectPath,
      transcript_path: entry.fullPath,
      terminal,
      docker: {
        is_container: false,
        container_id: '',
        container_name: '',
      },
      git,
      timestamp: entry.created,
      // Add displayName as a custom field that we'll extract
      // Note: This doesn't exist on SessionStartEvent, we'll handle it in the service
    } as SessionStartEvent & { displayName?: string };
  }

  /**
   * Get transcript file mtime to determine activity
   */
  getTranscriptMtime(transcriptPath: string): Date | null {
    try {
      const stats = fs.statSync(transcriptPath);
      return stats.mtime;
    } catch {
      return null;
    }
  }

  /**
   * Check if projects directory exists
   */
  projectsExist(): boolean {
    return fs.existsSync(this.claudeProjectsDir);
  }

  /**
   * Start watching for session changes
   */
  start(
    onSessionDiscovered: (event: SessionStartEvent) => void,
    onSessionUpdated: (sessionId: string, modified: Date) => void
  ): void {
    this.onSessionDiscovered = onSessionDiscovered;
    this.onSessionUpdated = onSessionUpdated;

    // Initial scan
    const entries = this.scanAllProjects();
    for (const entry of entries) {
      this.knownSessions.set(entry.sessionId, entry);
      const event = this.toSessionEvent(entry);
      onSessionDiscovered(event);
    }

    // Watch the projects directory for new project folders
    if (fs.existsSync(this.claudeProjectsDir)) {
      try {
        const watcher = fs.watch(this.claudeProjectsDir, { persistent: false }, (eventType, filename) => {
          if (eventType === 'rename' && filename) {
            // A new project folder may have been added
            this.rescan();
          }
        });
        this.watchers.set(this.claudeProjectsDir, watcher);
      } catch (err) {
        this.log('Error watching projects directory:', err);
      }
    }

    // Poll for changes periodically (file watchers can miss events)
    this.pollInterval = setInterval(() => {
      this.rescan();
      this.checkTranscriptActivity();
    }, 5000);
  }

  /**
   * Rescan for new sessions
   */
  private rescan(): void {
    const entries = this.scanAllProjects();

    for (const entry of entries) {
      if (!this.knownSessions.has(entry.sessionId)) {
        // New session discovered
        this.knownSessions.set(entry.sessionId, entry);
        if (this.onSessionDiscovered) {
          const event = this.toSessionEvent(entry);
          this.onSessionDiscovered(event);
        }
      } else {
        // Check if modified time changed
        const known = this.knownSessions.get(entry.sessionId)!;
        if (entry.modified !== known.modified) {
          this.knownSessions.set(entry.sessionId, entry);
          if (this.onSessionUpdated) {
            this.onSessionUpdated(entry.sessionId, new Date(entry.modified));
          }
        }
      }
    }
  }

  /**
   * Check transcript file mtimes for activity detection
   */
  private checkTranscriptActivity(): void {
    for (const [sessionId, entry] of this.knownSessions) {
      const mtime = this.getTranscriptMtime(entry.fullPath);
      if (mtime && this.onSessionUpdated) {
        // Only notify if the mtime is more recent than what we know
        const knownModified = new Date(entry.modified);
        if (mtime > knownModified) {
          this.onSessionUpdated(sessionId, mtime);
        }
      }
    }
  }

  /**
   * Stop watching
   */
  stop(): void {
    for (const [, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    this.onSessionDiscovered = null;
    this.onSessionUpdated = null;
  }

  /**
   * Get all known sessions
   */
  getKnownSessions(): SessionIndexEntry[] {
    return Array.from(this.knownSessions.values());
  }
}
