import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import * as readline from "readline";
import { c as createServerFn } from "../server.js";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core";
import "node:async_hooks";
import "@tanstack/router-core/ssr/server";
import "h3-v2";
import "tiny-invariant";
import "seroval";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
import "@tanstack/react-router";
const initialState = {
  sessions: /* @__PURE__ */ new Map(),
  recentActivity: [],
  stats: {
    totalEvents: 0,
    eventsByType: {}
  }
};
function detectPhantomSession(transcriptFile) {
  if (!transcriptFile)
    return false;
  const birthtime = new Date(transcriptFile.birthtime);
  const mtime = new Date(transcriptFile.mtime);
  const diffSeconds = (mtime.getTime() - birthtime.getTime()) / 1e3;
  return diffSeconds < 60 && transcriptFile.size < 5e4;
}
function findRealSession(phantomSessionId, phantomStartTime, phantomCwd, existingSessions) {
  for (const [sessionId, session] of existingSessions) {
    if (sessionId === phantomSessionId)
      continue;
    if (session.cwd !== phantomCwd)
      continue;
    if (session.startTime >= phantomStartTime)
      continue;
    if (session.endTime && session.endTime < phantomStartTime)
      continue;
    const timeDiff = Math.abs(session.lastActivityTime.getTime() - phantomStartTime.getTime());
    if (timeDiff < 30 * 60 * 1e3) {
      return sessionId;
    }
  }
  return void 0;
}
function createPhantomSession(sessionId, timestamp, cwd, transcriptPath, terminal, git) {
  return {
    id: sessionId,
    cwd: cwd || "unknown",
    transcriptPath: transcriptPath || "unknown",
    terminal: terminal || {},
    git: git || {},
    status: "active",
    startTime: timestamp,
    lastActivityTime: timestamp,
    awaitingInput: false,
    isPhantom: true,
    // Mark as phantom since we're creating it from activity
    phantomOf: void 0,
    transcriptBirthtime: void 0,
    transcriptModifiedTime: void 0
  };
}
function getOrCreateSession(state, sessionId, timestamp, eventData) {
  const existing = state.sessions.get(sessionId);
  if (existing) {
    return { session: existing, isNew: false };
  }
  const phantom = createPhantomSession(sessionId, timestamp, eventData?.cwd, eventData?.transcript_path, eventData?.terminal, eventData?.git);
  return { session: phantom, isNew: true };
}
function activityReducer(state, action) {
  switch (action.type) {
    case "SESSION_START": {
      const { payload } = action;
      const transcriptFile = payload.transcript_file;
      const isPhantom = detectPhantomSession(transcriptFile);
      const startTime = new Date(payload.timestamp);
      let phantomOf;
      if (isPhantom) {
        phantomOf = findRealSession(payload.session_id, startTime, payload.cwd, state.sessions);
      }
      const newSession = {
        id: payload.session_id,
        cwd: payload.cwd,
        transcriptPath: payload.transcript_path,
        terminal: payload.terminal,
        git: payload.git,
        status: "active",
        startTime,
        lastActivityTime: startTime,
        awaitingInput: false,
        // Phantom detection fields
        isPhantom,
        phantomOf,
        transcriptBirthtime: transcriptFile ? new Date(transcriptFile.birthtime) : void 0,
        transcriptModifiedTime: transcriptFile ? new Date(transcriptFile.mtime) : void 0
      };
      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, newSession);
      return {
        ...state,
        sessions: newSessions,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            SESSION_START: (state.stats.eventsByType.SESSION_START || 0) + 1
          }
        }
      };
    }
    case "SESSION_END": {
      const { payload } = action;
      const timestamp = new Date(payload.timestamp);
      const { session, isNew } = getOrCreateSession(state, payload.session_id, timestamp, {
        cwd: payload.cwd,
        transcript_path: payload.transcript_path,
        terminal: payload.terminal,
        git: payload.git
      });
      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        // Update metadata from session_end if we created a phantom or if metadata is unknown
        cwd: session.cwd === "unknown" && payload.cwd ? payload.cwd : session.cwd,
        transcriptPath: session.transcriptPath === "unknown" && payload.transcript_path ? payload.transcript_path : session.transcriptPath,
        terminal: Object.keys(session.terminal).length === 0 && payload.terminal ? payload.terminal : session.terminal,
        git: Object.keys(session.git || {}).length === 0 && payload.git ? payload.git : session.git,
        status: "ended",
        endTime: timestamp
      });
      return {
        ...state,
        sessions: newSessions,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            SESSION_END: (state.stats.eventsByType.SESSION_END || 0) + 1
          }
        }
      };
    }
    case "ACTIVITY_NOTIFICATION": {
      const { payload } = action;
      const timestamp = new Date(payload.timestamp);
      const { session } = getOrCreateSession(state, payload.session_id, timestamp);
      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: timestamp,
        status: "active",
        awaitingInput: true,
        // Set awaiting input on notification
        notificationMessage: payload.notification_message,
        endTime: void 0
        // Clear end time since session is active again
      });
      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);
      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1
          }
        }
      };
    }
    case "ACTIVITY_PROMPT_SUBMIT":
    case "ACTIVITY_TOOL_USE": {
      const { payload } = action;
      const timestamp = new Date(payload.timestamp);
      const { session } = getOrCreateSession(state, payload.session_id, timestamp);
      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: timestamp,
        status: "active",
        awaitingInput: false,
        // Clear awaiting input on user response or tool use
        notificationMessage: void 0,
        endTime: void 0
        // Clear end time since session is active again
      });
      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);
      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1
          }
        }
      };
    }
    case "ACTIVITY_STOP": {
      const { payload } = action;
      const timestamp = new Date(payload.timestamp);
      const { session } = getOrCreateSession(state, payload.session_id, timestamp);
      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: timestamp,
        status: "active",
        awaitingInput: true,
        // Agent finished responding, now awaiting user input
        notificationMessage: "Awaiting user input",
        endTime: void 0
        // Clear end time since session is active again
      });
      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);
      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1
          }
        }
      };
    }
    case "ACTIVITY_SUBAGENT_STOP": {
      const { payload } = action;
      const timestamp = new Date(payload.timestamp);
      const { session } = getOrCreateSession(state, payload.session_id, timestamp);
      const newSessions = new Map(state.sessions);
      newSessions.set(payload.session_id, {
        ...session,
        lastActivityTime: timestamp,
        status: "active",
        endTime: void 0
        // Clear end time since session is active again
      });
      const newRecentActivity = [payload, ...state.recentActivity].slice(0, 100);
      return {
        ...state,
        sessions: newSessions,
        recentActivity: newRecentActivity,
        stats: {
          totalEvents: state.stats.totalEvents + 1,
          eventsByType: {
            ...state.stats.eventsByType,
            [action.type]: (state.stats.eventsByType[action.type] || 0) + 1
          }
        }
      };
    }
    case "UPDATE_SESSION_STATUSES": {
      const { currentTime, inactiveThresholdMs, removeEndedSessionsMs } = action.payload;
      const newSessions = /* @__PURE__ */ new Map();
      let changed = false;
      for (const [id, session] of state.sessions) {
        if (session.status === "ended") {
          if (session.endTime && currentTime - session.endTime.getTime() > removeEndedSessionsMs) {
            changed = true;
            continue;
          }
          newSessions.set(id, session);
        } else {
          const timeSinceActivity = currentTime - session.lastActivityTime.getTime();
          const shouldBeInactive = timeSinceActivity > inactiveThresholdMs;
          if (shouldBeInactive && session.status === "active") {
            newSessions.set(id, { ...session, status: "inactive" });
            changed = true;
          } else if (!shouldBeInactive && session.status === "inactive") {
            newSessions.set(id, { ...session, status: "active" });
            changed = true;
          } else {
            newSessions.set(id, session);
          }
        }
      }
      return changed ? { ...state, sessions: newSessions } : state;
    }
    case "UPDATE_WORK_SUMMARY": {
      const { sessionId, summary } = action.payload;
      const timestamp = /* @__PURE__ */ new Date();
      const { session } = getOrCreateSession(state, sessionId, timestamp);
      const newSessions = new Map(state.sessions);
      newSessions.set(sessionId, {
        ...session,
        workSummary: summary,
        lastActivityTime: timestamp
        // Update activity time when work summary changes
      });
      return {
        ...state,
        sessions: newSessions
      };
    }
    default:
      return state;
  }
}
class ActivityStore {
  state;
  listeners = /* @__PURE__ */ new Set();
  config;
  constructor(config = {}) {
    this.state = initialState;
    this.config = {
      inactiveThresholdMs: config.inactiveThresholdMs ?? 5 * 60 * 1e3,
      // 5 minutes
      removeEndedSessionsMs: config.removeEndedSessionsMs ?? 60 * 1e3,
      // 1 minute
      enableLogging: config.enableLogging ?? false
    };
  }
  /**
   * Dispatch an action to the reducer
   */
  dispatch(action) {
    if (this.config.enableLogging) {
      console.log("[ActivityStore] Action:", action.type, action.payload);
    }
    const previousState = this.state;
    this.state = activityReducer(this.state, action);
    if (this.state !== previousState) {
      if (this.config.enableLogging) {
        console.log("[ActivityStore] State changed");
      }
      this.notifyListeners();
    }
  }
  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
  /**
   * Get all sessions, sorted by priority
   * Priority order: awaiting input > active > inactive > ended
   * Phantom sessions that are duplicates (have phantomOf) are filtered out
   */
  getSessions() {
    const sessions = Array.from(this.state.sessions.values()).filter((session) => !session.phantomOf);
    return sessions.sort((a, b) => {
      if (a.awaitingInput && !b.awaitingInput)
        return -1;
      if (b.awaitingInput && !a.awaitingInput)
        return 1;
      if (a.status === "ended" && b.status !== "ended")
        return 1;
      if (b.status === "ended" && a.status !== "ended")
        return -1;
      if (a.status === "active" && b.status === "inactive")
        return -1;
      if (b.status === "active" && a.status === "inactive")
        return 1;
      return b.lastActivityTime.getTime() - a.lastActivityTime.getTime();
    });
  }
  /**
   * Get a specific session by ID
   */
  getSession(sessionId) {
    return this.state.sessions.get(sessionId);
  }
  /**
   * Get count of sessions by status
   */
  getSessionCounts() {
    let active = 0;
    let inactive = 0;
    let ended = 0;
    let awaitingInput = 0;
    for (const session of this.state.sessions.values()) {
      if (session.awaitingInput)
        awaitingInput++;
      if (session.status === "active")
        active++;
      else if (session.status === "inactive")
        inactive++;
      else if (session.status === "ended")
        ended++;
    }
    return { active, inactive, ended, awaitingInput, total: this.state.sessions.size };
  }
  /**
   * Get recent activity events
   */
  getRecentActivity(limit) {
    return limit ? this.state.recentActivity.slice(0, limit) : this.state.recentActivity;
  }
  /**
   * Get activity events for a specific session
   */
  getSessionActivity(sessionId, limit) {
    const sessionEvents = this.state.recentActivity.filter((event) => event.session_id === sessionId);
    return limit ? sessionEvents.slice(0, limit) : sessionEvents;
  }
  /**
   * Get activity statistics
   */
  getStats() {
    return this.state.stats;
  }
  /**
   * Update a session's last activity time from transcript
   * Used to track activity even when events aren't firing
   */
  updateSessionActivityFromTranscript(sessionId, timestamp) {
    const session = this.state.sessions.get(sessionId);
    if (!session)
      return;
    if (timestamp > session.lastActivityTime) {
      const newSessions = new Map(this.state.sessions);
      newSessions.set(sessionId, {
        ...session,
        lastActivityTime: timestamp,
        status: "active",
        // Mark as active (even if previously ended)
        endTime: void 0
        // Clear end time since there's recent activity
      });
      this.state = {
        ...this.state,
        sessions: newSessions
      };
      this.notifyListeners();
    }
  }
  /**
   * Periodic update to refresh session statuses
   */
  updateSessionStatuses() {
    this.dispatch({
      type: "UPDATE_SESSION_STATUSES",
      payload: {
        currentTime: Date.now(),
        inactiveThresholdMs: this.config.inactiveThresholdMs,
        removeEndedSessionsMs: this.config.removeEndedSessionsMs
      }
    });
  }
  /**
   * Clear all state (useful for testing)
   */
  clear() {
    this.state = initialState;
    this.notifyListeners();
  }
  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
class ProjectScanner {
  claudeProjectsDir;
  enableLogging;
  watchers = /* @__PURE__ */ new Map();
  pollInterval = null;
  knownSessions = /* @__PURE__ */ new Map();
  onSessionDiscovered = null;
  onSessionUpdated = null;
  constructor(options = {}) {
    this.claudeProjectsDir = options.claudeProjectsDir || path.join(homedir(), ".claude", "projects");
    this.enableLogging = options.enableLogging ?? false;
  }
  log(...args) {
    if (this.enableLogging) {
      console.log("[ProjectScanner]", ...args);
    }
  }
  /**
   * Extract session metadata from a JSONL transcript file by reading the first few lines.
   * Only reads a limited portion of the file to avoid memory issues with large transcripts.
   * Returns a SessionIndexEntry or null if unable to parse.
   */
  extractSessionFromJsonl(jsonlPath) {
    try {
      const fd = fs.openSync(jsonlPath, "r");
      const buffer = Buffer.alloc(100 * 1024);
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);
      const fileContent = buffer.toString("utf-8", 0, bytesRead);
      const lines = fileContent.split("\n").filter((line) => line.trim());
      let sessionId = "";
      let cwd = "";
      let firstPrompt = "No prompt";
      let created = "";
      let modified = "";
      let gitBranch = "";
      let isSidechain = false;
      let messageCount = 0;
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        try {
          const entry = JSON.parse(lines[i]);
          if (entry.sessionId && !sessionId) {
            sessionId = entry.sessionId;
          }
          if (entry.cwd && !cwd) {
            cwd = entry.cwd;
          }
          if (entry.gitBranch && !gitBranch) {
            gitBranch = entry.gitBranch;
          }
          if (entry.isSidechain !== void 0) {
            isSidechain = entry.isSidechain;
          }
          if (entry.type === "user" && entry.message?.content && firstPrompt === "No prompt") {
            const content = entry.message.content;
            if (typeof content === "string") {
              firstPrompt = content.length > 200 ? content.substring(0, 197) + "..." : content;
            } else if (Array.isArray(content)) {
              const textContent = content.find((c) => c.type === "text");
              if (textContent && textContent.text) {
                firstPrompt = textContent.text.length > 200 ? textContent.text.substring(0, 197) + "..." : textContent.text;
              }
            }
            if (!created && entry.timestamp) {
              created = entry.timestamp;
            }
          }
          if (entry.type === "user" || entry.type === "assistant") {
            messageCount++;
          }
        } catch {
        }
      }
      const stats = fs.statSync(jsonlPath);
      modified = stats.mtime.toISOString();
      if (!created) {
        created = stats.birthtime?.toISOString() || modified;
      }
      if (!sessionId) {
        const basename = path.basename(jsonlPath, ".jsonl");
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(basename)) {
          sessionId = basename;
        }
      }
      if (!sessionId) {
        return null;
      }
      return {
        sessionId,
        fullPath: jsonlPath,
        fileMtime: stats.mtimeMs,
        firstPrompt,
        messageCount,
        created,
        modified,
        projectPath: cwd || path.dirname(jsonlPath),
        gitBranch,
        isSidechain
      };
    } catch (err) {
      this.log("Error extracting session from JSONL:", jsonlPath, err);
      return null;
    }
  }
  /**
   * Scan a project directory for JSONL files (fallback when no sessions-index.json)
   */
  scanProjectJsonlFiles(projectDir) {
    const entries = [];
    try {
      const files = fs.readdirSync(projectDir, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".jsonl")) {
          const jsonlPath = path.join(projectDir, file.name);
          const entry = this.extractSessionFromJsonl(jsonlPath);
          if (entry && !entry.isSidechain) {
            entries.push(entry);
          }
        }
      }
    } catch (err) {
      this.log("Error scanning project directory for JSONL files:", projectDir, err);
    }
    return entries;
  }
  /**
   * Scan all sessions-index.json files and JSONL files, return entries
   */
  scanAllProjects() {
    const entries = [];
    const seenSessionIds = /* @__PURE__ */ new Set();
    if (!fs.existsSync(this.claudeProjectsDir)) {
      this.log("Projects directory does not exist:", this.claudeProjectsDir);
      return entries;
    }
    try {
      const projectDirs = fs.readdirSync(this.claudeProjectsDir, { withFileTypes: true });
      for (const dirent of projectDirs) {
        if (!dirent.isDirectory())
          continue;
        const projectPath = path.join(this.claudeProjectsDir, dirent.name);
        const indexPath = path.join(projectPath, "sessions-index.json");
        if (fs.existsSync(indexPath)) {
          try {
            const content = fs.readFileSync(indexPath, "utf-8");
            const indexFile = JSON.parse(content);
            if (indexFile.entries && Array.isArray(indexFile.entries)) {
              for (const entry of indexFile.entries) {
                if (entry.isSidechain)
                  continue;
                entries.push(entry);
                seenSessionIds.add(entry.sessionId);
              }
            }
          } catch (err) {
            this.log("Error reading index file:", indexPath, err);
          }
        }
        const jsonlEntries = this.scanProjectJsonlFiles(projectPath);
        for (const entry of jsonlEntries) {
          if (!seenSessionIds.has(entry.sessionId)) {
            entries.push(entry);
            seenSessionIds.add(entry.sessionId);
          }
        }
      }
    } catch (err) {
      this.log("Error scanning projects directory:", err);
    }
    this.log(`Found ${entries.length} sessions (from index + JSONL files)`);
    return entries;
  }
  /**
   * Convert a session index entry to a synthetic SessionStartEvent
   */
  toSessionEvent(entry) {
    const terminal = {
      tty: "",
      term: "",
      shell: "",
      ppid: "",
      term_program: "",
      term_session_id: "",
      lc_terminal: "",
      lc_terminal_version: "",
      iterm: {
        session_id: "",
        profile: "",
        tab_name: "",
        window_name: ""
      }
    };
    const git = {
      is_repo: !!entry.gitBranch,
      branch: entry.gitBranch || "",
      is_worktree: false,
      is_dirty: false,
      repo_name: ""
    };
    entry.firstPrompt ? entry.firstPrompt.length > 60 ? entry.firstPrompt.substring(0, 57) + "..." : entry.firstPrompt : "No prompt";
    return {
      event_type: "session_start",
      session_id: entry.sessionId,
      cwd: entry.projectPath,
      transcript_path: entry.fullPath,
      terminal,
      docker: {
        is_container: false,
        container_id: "",
        container_name: ""
      },
      git,
      timestamp: entry.created
      // Add displayName as a custom field that we'll extract
      // Note: This doesn't exist on SessionStartEvent, we'll handle it in the service
    };
  }
  /**
   * Get transcript file mtime to determine activity
   */
  getTranscriptMtime(transcriptPath) {
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
  projectsExist() {
    return fs.existsSync(this.claudeProjectsDir);
  }
  /**
   * Start watching for session changes
   */
  start(onSessionDiscovered, onSessionUpdated) {
    this.onSessionDiscovered = onSessionDiscovered;
    this.onSessionUpdated = onSessionUpdated;
    const entries = this.scanAllProjects();
    for (const entry of entries) {
      this.knownSessions.set(entry.sessionId, entry);
      const event = this.toSessionEvent(entry);
      onSessionDiscovered(event);
    }
    if (fs.existsSync(this.claudeProjectsDir)) {
      try {
        const watcher = fs.watch(this.claudeProjectsDir, { persistent: false }, (eventType, filename) => {
          if (eventType === "rename" && filename) {
            this.rescan();
          }
        });
        this.watchers.set(this.claudeProjectsDir, watcher);
      } catch (err) {
        this.log("Error watching projects directory:", err);
      }
    }
    this.pollInterval = setInterval(() => {
      this.rescan();
      this.checkTranscriptActivity();
    }, 5e3);
  }
  /**
   * Rescan for new sessions
   */
  rescan() {
    const entries = this.scanAllProjects();
    for (const entry of entries) {
      if (!this.knownSessions.has(entry.sessionId)) {
        this.knownSessions.set(entry.sessionId, entry);
        if (this.onSessionDiscovered) {
          const event = this.toSessionEvent(entry);
          this.onSessionDiscovered(event);
        }
      } else {
        const known = this.knownSessions.get(entry.sessionId);
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
  checkTranscriptActivity() {
    for (const [sessionId, entry] of this.knownSessions) {
      const mtime = this.getTranscriptMtime(entry.fullPath);
      if (mtime && this.onSessionUpdated) {
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
  stop() {
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
  getKnownSessions() {
    return Array.from(this.knownSessions.values());
  }
}
const actions = {
  sessionStart: (event) => ({
    type: "SESSION_START",
    payload: event
  }),
  sessionEnd: (event) => ({
    type: "SESSION_END",
    payload: event
  }),
  activityToolUse: (event) => ({
    type: "ACTIVITY_TOOL_USE",
    payload: event
  }),
  activityPromptSubmit: (event) => ({
    type: "ACTIVITY_PROMPT_SUBMIT",
    payload: event
  }),
  activityStop: (event) => ({
    type: "ACTIVITY_STOP",
    payload: event
  }),
  activitySubagentStop: (event) => ({
    type: "ACTIVITY_SUBAGENT_STOP",
    payload: event
  }),
  activityNotification: (event) => ({
    type: "ACTIVITY_NOTIFICATION",
    payload: event
  }),
  updateSessionStatuses: (currentTime, inactiveThresholdMs, removeEndedSessionsMs) => ({
    type: "UPDATE_SESSION_STATUSES",
    payload: { currentTime, inactiveThresholdMs, removeEndedSessionsMs }
  }),
  updateWorkSummary: (sessionId, summary) => ({
    type: "UPDATE_WORK_SUMMARY",
    payload: { sessionId, summary }
  })
};
class ExploreTrackerService {
  scanner;
  store;
  started = false;
  displayNames = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    this.scanner = new ProjectScanner({
      claudeProjectsDir: options.claudeProjectsDir,
      enableLogging: options.enableLogging ?? false
    });
    this.store = new ActivityStore({
      enableLogging: options.enableLogging ?? false,
      inactiveThresholdMs: options.inactiveThresholdMs ?? 5 * 60 * 1e3,
      // 5 minutes
      removeEndedSessionsMs: options.removeEndedSessionsMs ?? 24 * 60 * 60 * 1e3
      // 24 hours (don't remove)
    });
  }
  /**
   * Start scanning and watching for sessions
   * Idempotent - safe to call multiple times
   */
  start() {
    if (this.started) {
      return;
    }
    this.scanner.start(
      // onSessionDiscovered
      (event) => {
        const entries = this.scanner.getKnownSessions();
        const entry = entries.find((e) => e.sessionId === event.session_id);
        if (entry?.firstPrompt) {
          const displayName = entry.firstPrompt.length > 60 ? entry.firstPrompt.substring(0, 57) + "..." : entry.firstPrompt;
          this.displayNames.set(event.session_id, displayName);
        }
        this.store.dispatch(actions.sessionStart(event));
        if (entry) {
          this.store.updateSessionActivityFromTranscript(event.session_id, new Date(entry.modified));
        }
      },
      // onSessionUpdated
      (sessionId, modified) => {
        this.store.updateSessionActivityFromTranscript(sessionId, modified);
      }
    );
    this.started = true;
  }
  /**
   * Stop scanning and watching
   * Idempotent - safe to call multiple times
   */
  stop() {
    if (!this.started) {
      return;
    }
    this.scanner.stop();
    this.started = false;
  }
  /**
   * Check if the projects directory exists
   */
  fileExists() {
    return this.scanner.projectsExist();
  }
  /**
   * Get all sessions, sorted by activity (most recent first)
   * Enhances sessions with display names from firstPrompt
   */
  getSessions() {
    const sessions = this.store.getSessions();
    return sessions.map((session) => {
      const displayName = this.displayNames.get(session.id);
      if (displayName && !session.displayName) {
        return { ...session, displayName };
      }
      return session;
    });
  }
  /**
   * Get session counts by status
   */
  getSessionCounts() {
    return this.store.getSessionCounts();
  }
  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener) {
    return this.store.subscribe(listener);
  }
  /**
   * Manually trigger session status updates
   * Useful for periodic checks of session activity
   */
  updateSessionStatuses() {
    this.store.updateSessionStatuses();
  }
  /**
   * Update a session's activity time from its transcript
   * Used to keep session activity current based on transcript file timestamps
   */
  updateSessionActivityFromTranscript(sessionId, timestamp) {
    this.store.updateSessionActivityFromTranscript(sessionId, timestamp);
  }
  /**
   * Get activity statistics
   */
  getStats() {
    return this.store.getStats();
  }
  /**
   * Get recent activity events
   */
  getRecentActivity(limit) {
    return this.store.getRecentActivity(limit);
  }
  /**
   * Get activity events for a specific session
   */
  getSessionActivity(sessionId, limit) {
    return this.store.getSessionActivity(sessionId, limit);
  }
  /**
   * Check if the service is currently watching for events
   */
  isStarted() {
    return this.started;
  }
}
function isSystemMessage(entry) {
  return entry.isSidechain === true || entry.type === "system" || entry.isMeta === true;
}
class TranscriptReader {
  /**
   * Helper: Check if content contains bash-input tags
   */
  isBashInput(content) {
    return /<bash-input>[\s\S]*?<\/bash-input>/.test(content);
  }
  /**
   * Helper: Check if content contains bash-stdout or bash-stderr tags
   */
  isBashOutput(content) {
    return /<bash-stdout>[\s\S]*?<\/bash-stdout>/.test(content) || /<bash-stderr>[\s\S]*?<\/bash-stderr>/.test(content);
  }
  /**
   * Helper: Extract bash command from bash-input tags
   */
  extractBashCommand(content) {
    const match = content.match(/<bash-input>([\s\S]*?)<\/bash-input>/);
    return match ? match[1].trim() : "";
  }
  /**
   * Helper: Extract bash stdout from bash-stdout tags
   */
  extractBashStdout(content) {
    const match = content.match(/<bash-stdout>([\s\S]*?)<\/bash-stdout>/);
    return match ? match[1].trim() : "";
  }
  /**
   * Helper: Extract bash stderr from bash-stderr tags
   */
  extractBashStderr(content) {
    const match = content.match(/<bash-stderr>([\s\S]*?)<\/bash-stderr>/);
    return match ? match[1].trim() : "";
  }
  /**
   * Read and parse a transcript file
   */
  async readTranscript(transcriptPath) {
    try {
      if (!fs.existsSync(transcriptPath)) {
        throw new Error(`Transcript file not found: ${transcriptPath}`);
      }
      const rawEntries = [];
      const fileStream = fs.createReadStream(transcriptPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      for await (const line of rl) {
        if (!line.trim())
          continue;
        try {
          const entry = JSON.parse(line);
          rawEntries.push(entry);
        } catch (err) {
          console.error("Failed to parse transcript line:", err);
        }
      }
      const parsedEntries = [];
      let skip = 0;
      for (let i = 0; i < rawEntries.length; i++) {
        if (skip > 0) {
          skip--;
          continue;
        }
        const current = rawEntries[i];
        const upcoming = rawEntries.slice(i + 1, i + 4);
        const result = this.parseEntry(current, upcoming);
        if (result.parsed) {
          parsedEntries.push(result.parsed);
        }
        skip = result.consumed;
      }
      return parsedEntries;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read transcript: ${error.message}`);
      }
      throw error;
    }
  }
  /**
   * Get recent N entries from transcript
   */
  async getRecentEntries(transcriptPath, limit = 5) {
    const allEntries = await this.readTranscript(transcriptPath);
    return allEntries.slice(-limit);
  }
  /**
   * Parse a transcript entry into display format
   * @param entry - The current entry to parse
   * @param upcoming - Array of upcoming entries for look-ahead (up to 3 entries)
   * @returns Object with parsed entry and number of upcoming entries consumed
   */
  parseEntry(entry, upcoming = []) {
    const timestamp = new Date(entry.timestamp);
    const isSystem = isSystemMessage(entry);
    if (entry.type === "user" && entry.message) {
      if (Array.isArray(entry.message.content)) {
        const toolResultBlocks = entry.message.content.filter((block) => block.type === "tool_result");
        if (toolResultBlocks.length > 0) {
          const toolResult = toolResultBlocks[0];
          if (toolResult.type === "tool_result") {
            return {
              parsed: {
                uuid: entry.uuid,
                timestamp,
                type: "tool_result",
                content: toolResult.content,
                toolUseId: toolResult.tool_use_id,
                isError: toolResult.is_error
              },
              consumed: 0
            };
          }
        }
      }
      let content;
      if (typeof entry.message.content === "string") {
        content = entry.message.content;
      } else if (Array.isArray(entry.message.content)) {
        content = entry.message.content.filter((block) => block.type === "text").map((block) => block.type === "text" ? block.text : "").join("\n\n");
      } else {
        content = "";
      }
      if (!content.trim()) {
        return { parsed: null, consumed: 0 };
      }
      if (this.isBashInput(content)) {
        for (let i = 0; i < upcoming.length; i++) {
          const nextEntry = upcoming[i];
          if (nextEntry.type !== "user" || !nextEntry.message) {
            continue;
          }
          let nextContent;
          if (typeof nextEntry.message.content === "string") {
            nextContent = nextEntry.message.content;
          } else if (Array.isArray(nextEntry.message.content)) {
            nextContent = nextEntry.message.content.filter((block) => block.type === "text").map((block) => block.type === "text" ? block.text : "").join("\n\n");
          } else {
            continue;
          }
          if (this.isBashOutput(nextContent)) {
            const command2 = this.extractBashCommand(content);
            const stdout = this.extractBashStdout(nextContent);
            const stderr = this.extractBashStderr(nextContent);
            let combinedContent = `$ ${command2}`;
            if (stdout) {
              combinedContent += `

${stdout}`;
            }
            if (stderr) {
              combinedContent += `

[stderr]
${stderr}`;
            }
            return {
              parsed: {
                uuid: entry.uuid,
                timestamp,
                type: "user",
                content: combinedContent,
                isSystemMessage: isSystem
              },
              consumed: i + 1
              // We consumed the output entry (and any entries in between)
            };
          }
        }
        const command = this.extractBashCommand(content);
        return {
          parsed: {
            uuid: entry.uuid,
            timestamp,
            type: "user",
            content: `$ ${command}`,
            isSystemMessage: isSystem
          },
          consumed: 0
        };
      }
      if (this.isBashOutput(content)) {
        const stdout = this.extractBashStdout(content);
        const stderr = this.extractBashStderr(content);
        let outputContent = "";
        if (stdout) {
          outputContent += stdout;
        }
        if (stderr) {
          outputContent += (outputContent ? "\n\n" : "") + `[stderr]
${stderr}`;
        }
        return {
          parsed: {
            uuid: entry.uuid,
            timestamp,
            type: "user",
            content: outputContent,
            isSystemMessage: isSystem
          },
          consumed: 0
        };
      }
      if (entry.isMeta) {
        return {
          parsed: {
            uuid: entry.uuid,
            timestamp,
            type: "meta",
            content,
            isSystemMessage: true
          },
          consumed: 0
        };
      }
      return {
        parsed: {
          uuid: entry.uuid,
          timestamp,
          type: "user",
          content,
          isSystemMessage: isSystem
        },
        consumed: 0
      };
    }
    if (entry.type === "assistant" && entry.message) {
      const message = entry.message;
      const textBlocks = message.content.filter((block) => block.type === "text");
      const toolUseBlocks = message.content.filter((block) => block.type === "tool_use");
      const thinkingBlocks = message.content.filter((block) => block.type === "thinking");
      if (thinkingBlocks.length > 0) {
        const thinkingBlock = thinkingBlocks[0];
        if (thinkingBlock.type === "thinking") {
          return {
            parsed: {
              uuid: entry.uuid,
              timestamp,
              type: "thinking",
              content: thinkingBlock.thinking,
              isSystemMessage: true
              // Thinking is always system
            },
            consumed: 0
          };
        }
      }
      const textContent = textBlocks.map((block) => block.type === "text" ? block.text : "").join("\n\n");
      if (textContent) {
        return {
          parsed: {
            uuid: entry.uuid,
            timestamp,
            type: "assistant",
            content: textContent,
            isSystemMessage: isSystem
          },
          consumed: 0
        };
      }
      if (toolUseBlocks.length > 0) {
        const toolBlock = toolUseBlocks[0];
        if (toolBlock.type === "tool_use") {
          return {
            parsed: {
              uuid: entry.uuid,
              timestamp,
              type: "tool_use",
              content: `Used tool: ${toolBlock.name}`,
              toolName: toolBlock.name,
              toolId: toolBlock.id,
              toolInput: toolBlock.input
            },
            consumed: 0
          };
        }
      }
    }
    if (entry.type === "system") {
      return {
        parsed: {
          uuid: entry.uuid,
          timestamp,
          type: "system",
          content: entry.content || "System event",
          systemSubtype: entry.subtype,
          compactMetadata: entry.compactMetadata,
          isSystemMessage: true
        },
        consumed: 0
      };
    }
    if (entry.type === "file-history-snapshot") {
      const fileCount = entry.snapshot?.trackedFileBackups ? Object.keys(entry.snapshot.trackedFileBackups).length : 0;
      return {
        parsed: {
          uuid: entry.uuid,
          timestamp,
          type: "file-history",
          content: `File history snapshot (${fileCount} files tracked)`,
          fileCount,
          isSystemMessage: true
        },
        consumed: 0
      };
    }
    return { parsed: null, consumed: 0 };
  }
  /**
   * Get the timestamp of the last entry in the transcript
   * Useful for tracking session activity
   */
  async getLastEntryTimestamp(transcriptPath) {
    try {
      if (!fs.existsSync(transcriptPath)) {
        return null;
      }
      const content = fs.readFileSync(transcriptPath, "utf-8");
      const lines = content.split("\n").filter((line) => line.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const entry = JSON.parse(lines[i]);
          return new Date(entry.timestamp);
        } catch (err) {
          continue;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  /**
   * Read transcript synchronously for testing
   */
  readTranscriptSync(transcriptPath) {
    try {
      if (!fs.existsSync(transcriptPath)) {
        throw new Error(`Transcript file not found: ${transcriptPath}`);
      }
      const content = fs.readFileSync(transcriptPath, "utf-8");
      const lines = content.split("\n");
      const rawEntries = [];
      for (const line of lines) {
        if (!line.trim())
          continue;
        try {
          const entry = JSON.parse(line);
          rawEntries.push(entry);
        } catch (err) {
          console.error("Failed to parse transcript line:", err);
        }
      }
      const parsedEntries = [];
      let skip = 0;
      for (let i = 0; i < rawEntries.length; i++) {
        if (skip > 0) {
          skip--;
          continue;
        }
        const current = rawEntries[i];
        const upcoming = rawEntries.slice(i + 1, i + 4);
        const result = this.parseEntry(current, upcoming);
        if (result.parsed) {
          parsedEntries.push(result.parsed);
        }
        skip = result.consumed;
      }
      return parsedEntries;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read transcript: ${error.message}`);
      }
      throw error;
    }
  }
}
let service = null;
function getService() {
  if (!service) {
    service = new ExploreTrackerService({
      enableLogging: false
    });
    service.start();
  }
  return service;
}
function serializeSession(session) {
  return JSON.parse(JSON.stringify(session));
}
const getSessions_createServerFn_handler = createServerRpc({
  id: "ad6eeb84811df52eebb1cfc8f7bf200bc622506b4c6ce5cdde66c0dae0c9e6f3",
  name: "getSessions",
  filename: "src/server/sessions.ts"
}, (opts, signal) => getSessions.__executeServer(opts, signal));
const getSessions = createServerFn({
  method: "GET"
}).handler(getSessions_createServerFn_handler, async () => {
  const svc = getService();
  svc.updateSessionStatuses();
  const rawSessions = svc.getSessions();
  const sessions = rawSessions.map(serializeSession);
  const counts = svc.getSessionCounts();
  const data = {
    sessions,
    counts
  };
  return data;
});
const getSession_createServerFn_handler = createServerRpc({
  id: "3e1f35775f699a8089bc6d510c4b03455b3fd1cba241bad3e4fe50d994fbda49",
  name: "getSession",
  filename: "src/server/sessions.ts"
}, (opts, signal) => getSession.__executeServer(opts, signal));
const getSession = createServerFn({
  method: "GET"
}).handler(getSession_createServerFn_handler, async (ctx) => {
  const id = ctx.data;
  console.log("[getSession] Input ID:", id);
  const svc = getService();
  svc.updateSessionStatuses();
  const sessions = svc.getSessions();
  console.log("[getSession] Total sessions:", sessions.length);
  const session = sessions.find((s) => s.id === id) || null;
  console.log("[getSession] Found:", !!session);
  return {
    session: session ? serializeSession(session) : null
  };
});
const getTranscript_createServerFn_handler = createServerRpc({
  id: "cc944ffcc7a5a6aac7c3e979333a83e0bede32cf5f6039b21ebbf4fbbac9ec02",
  name: "getTranscript",
  filename: "src/server/sessions.ts"
}, (opts, signal) => getTranscript.__executeServer(opts, signal));
const getTranscript = createServerFn({
  method: "GET"
}).handler(getTranscript_createServerFn_handler, async (ctx) => {
  const {
    path: transcriptPath,
    limit = 50,
    before
  } = ctx.data;
  try {
    const reader = new TranscriptReader();
    const allEntries = await reader.readTranscript(transcriptPath);
    const userEntries = allEntries.filter((e) => e.type !== "system" && e.type !== "file-history" && e.type !== "meta");
    const total = userEntries.length;
    const sorted = [...userEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    let filtered = sorted;
    if (before) {
      const cursorTime = new Date(before).getTime();
      filtered = sorted.filter((e) => new Date(e.timestamp).getTime() < cursorTime);
    }
    const entries = filtered.slice(0, limit);
    const hasMore = filtered.length > limit;
    const oldestTimestamp = entries.length > 0 ? new Date(entries[entries.length - 1].timestamp).toISOString() : void 0;
    return {
      entries: JSON.parse(JSON.stringify(entries)),
      total,
      hasMore,
      oldestTimestamp
    };
  } catch {
    return {
      entries: [],
      total: 0,
      hasMore: false
    };
  }
});
export {
  getSession_createServerFn_handler,
  getSessions_createServerFn_handler,
  getTranscript_createServerFn_handler
};
