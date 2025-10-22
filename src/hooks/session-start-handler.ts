#!/usr/bin/env node
/**
 * Session Start Handler
 * Complete TypeScript implementation of session start hook logic
 * Replaces session-start.sh bash script
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// ============================================================================
// Types
// ============================================================================

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

interface TranscriptFileInfo {
  birthtime: string;  // File creation time
  mtime: string;      // File modification time
  size: number;       // File size in bytes
}

interface SessionStartEvent {
  event_type: 'session_start';
  session_id: string;
  cwd: string;
  transcript_path: string;
  transcript_file?: TranscriptFileInfo;  // File stats for phantom detection
  terminal: TerminalInfo;
  docker: DockerInfo;
  git: GitInfo;
  timestamp: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely execute a shell command with timeout
 */
function execSafe(command: string, timeoutMs: number = 200): string {
  try {
    return execSync(command, {
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
    }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get environment variable with default
 */
function getEnv(name: string, defaultValue: string = 'unknown'): string {
  return process.env[name] || defaultValue;
}

/**
 * Check if file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Read file safely
 */
function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ============================================================================
// Terminal Information Providers
// ============================================================================

/**
 * Get iTerm2-specific information using AppleScript
 */
function getITermInfo(): { session_id: string; profile: string; tab_name: string; window_name: string } {
  const termProgram = getEnv('TERM_PROGRAM');

  if (termProgram !== 'iTerm.app') {
    return {
      session_id: 'unknown',
      profile: 'unknown',
      tab_name: 'unknown',
      window_name: 'unknown'
    };
  }

  // Check if osascript is available (macOS only)
  const hasOsascript = execSafe('command -v osascript', 100) !== 'unknown';
  if (!hasOsascript) {
    return {
      session_id: getEnv('ITERM_SESSION_ID'),
      profile: getEnv('ITERM_PROFILE'),
      tab_name: 'unknown',
      window_name: 'unknown'
    };
  }

  // Get tab name
  const tabName = execSafe(`osascript -e 'tell application "iTerm2"
    try
      tell current session of current tab of current window
        get name
      end tell
    end try
  end tell'`, 500);

  // Get window name
  const windowName = execSafe(`osascript -e 'tell application "iTerm2"
    try
      tell current window
        get name
      end tell
    end try
  end tell'`, 500);

  return {
    session_id: getEnv('ITERM_SESSION_ID'),
    profile: getEnv('ITERM_PROFILE'),
    tab_name: tabName,
    window_name: windowName
  };
}

/**
 * Get terminal information
 */
function getTerminalInfo(): TerminalInfo {
  // Get TTY
  let tty = 'unknown';
  try {
    tty = execSync('tty', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    tty = 'unknown';
  }

  // Get iTerm info
  const itermInfo = getITermInfo();

  return {
    tty,
    term: getEnv('TERM'),
    shell: getEnv('SHELL'),
    ppid: getEnv('PPID'),
    term_program: getEnv('TERM_PROGRAM'),
    term_session_id: getEnv('TERM_SESSION_ID'),
    lc_terminal: getEnv('LC_TERMINAL'),
    lc_terminal_version: getEnv('LC_TERMINAL_VERSION'),
    iterm: itermInfo
  };
}

// ============================================================================
// Docker Detection
// ============================================================================

/**
 * Detect if running in Docker container
 */
function getDockerInfo(): DockerInfo {
  // Check for .dockerenv file
  const hasDockerEnv = fileExists('/.dockerenv');

  // Check cgroup for docker
  const cgroupContent = readFileSafe('/proc/self/cgroup');
  const hasCgroupDocker = cgroupContent.includes('docker');

  const isContainer = hasDockerEnv || hasCgroupDocker;

  if (!isContainer) {
    return {
      is_container: false,
      container_id: 'unknown',
      container_name: 'unknown'
    };
  }

  // Extract container ID from cgroup
  let containerId = 'unknown';
  const cgroup1Content = readFileSafe('/proc/1/cgroup');
  const match = cgroup1Content.match(/[0-9a-f]{64}/);
  if (match) {
    containerId = match[0];
  } else {
    // Try from /proc/self/cgroup
    const matchSelf = cgroupContent.match(/[0-9a-f]{64}/);
    if (matchSelf) {
      containerId = matchSelf[0];
    }
  }

  // Get container name (often the hostname)
  const containerName = execSafe('hostname', 100);

  return {
    is_container: true,
    container_id: containerId,
    container_name: containerName
  };
}

// ============================================================================
// Transcript File Information
// ============================================================================

/**
 * Get transcript file statistics for phantom detection
 */
function getTranscriptFileInfo(transcriptPath: string): TranscriptFileInfo | undefined {
  if (!transcriptPath || transcriptPath === 'unknown') {
    return undefined;
  }

  try {
    const stats = fs.statSync(transcriptPath);
    return {
      birthtime: stats.birthtime.toISOString(),
      mtime: stats.mtime.toISOString(),
      size: stats.size
    };
  } catch {
    return undefined;
  }
}

// ============================================================================
// Git Information
// ============================================================================

/**
 * Get git repository information
 */
function getGitInfo(cwd: string): GitInfo {
  // Change to the target directory
  const originalCwd = process.cwd();
  try {
    process.chdir(cwd);
  } catch {
    // If we can't change directory, return empty git info
    return {
      is_repo: false,
      branch: 'unknown',
      is_worktree: false,
      is_dirty: false,
      repo_name: 'unknown'
    };
  }

  // Check if in git repo
  const isRepo = execSafe('git rev-parse --is-inside-work-tree', 200) === 'true';

  if (!isRepo) {
    process.chdir(originalCwd);
    return {
      is_repo: false,
      branch: 'unknown',
      is_worktree: false,
      is_dirty: false,
      repo_name: 'unknown'
    };
  }

  // Get branch name
  const branch = execSafe('git rev-parse --abbrev-ref HEAD', 200);

  // Check if worktree
  const gitDir = execSafe('git rev-parse --git-dir', 200);
  const isWorktree = gitDir.includes('.git/worktrees');

  // Check if dirty (has uncommitted changes)
  const diffExitCode = execSafe('git diff-index --quiet HEAD; echo $?', 200);
  const isDirty = diffExitCode !== '0';

  // Get repo name from remote or folder name
  let repoName = 'unknown';
  const remoteUrl = execSafe('git remote get-url origin', 200);
  if (remoteUrl !== 'unknown' && remoteUrl !== '') {
    // Extract repo name from remote URL (handles both HTTPS and SSH)
    const urlMatch = remoteUrl.match(/[\/:]([^\/]+)\.git$/);
    if (urlMatch) {
      repoName = urlMatch[1];
    }
  }

  if (repoName === 'unknown') {
    // Fall back to top-level directory name
    const topLevel = execSafe('git rev-parse --show-toplevel', 200);
    if (topLevel !== 'unknown') {
      repoName = path.basename(topLevel);
    }
  }

  process.chdir(originalCwd);

  return {
    is_repo: true,
    branch,
    is_worktree: isWorktree,
    is_dirty: isDirty,
    repo_name: repoName
  };
}

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Process session start event
 */
export function handleSessionStart(hookInput: HookInput): SessionStartEvent {
  const timestamp = new Date().toISOString();
  const transcriptPath = hookInput.transcript_path || 'unknown';

  return {
    event_type: 'session_start',
    session_id: hookInput.session_id || 'unknown',
    cwd: hookInput.cwd || 'unknown',
    transcript_path: transcriptPath,
    transcript_file: getTranscriptFileInfo(transcriptPath),
    terminal: getTerminalInfo(),
    docker: getDockerInfo(),
    git: getGitInfo(hookInput.cwd || process.cwd()),
    timestamp
  };
}

/**
 * Main entry point when run as CLI
 */
function main() {
  try {
    // Read hook input from stdin
    const input = fs.readFileSync(0, 'utf-8');
    const hookInput = JSON.parse(input) as HookInput;

    // Process the event
    const event = handleSessionStart(hookInput);

    // Output as compact JSON
    console.log(JSON.stringify(event));

    // Write to JSONL file
    const logDir = path.join(process.env.HOME || '/tmp', '.agent-tracker');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'sessions.jsonl');
    fs.appendFileSync(logFile, JSON.stringify(event) + '\n');

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run main if executed directly (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  main();
}
