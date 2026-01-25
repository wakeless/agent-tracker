import { c as createServerRpc } from "./createServerRpc-Bd3B-Ah9.js";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
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
class TaskReader {
  tasksDir;
  enableLogging;
  constructor(options = {}) {
    this.tasksDir = options.tasksDir || path.join(homedir(), ".claude", "tasks");
    this.enableLogging = options.enableLogging ?? false;
  }
  log(...args) {
    if (this.enableLogging) {
      console.log("[TaskReader]", ...args);
    }
  }
  /**
   * Check if the tasks directory exists
   */
  tasksExist() {
    return fs.existsSync(this.tasksDir);
  }
  /**
   * Get the tasks directory path
   */
  getTasksDir() {
    return this.tasksDir;
  }
  /**
   * Scan the tasks directory and return summaries for all conversation task sets
   */
  scanTaskSets() {
    const summaries = [];
    if (!this.tasksExist()) {
      this.log("Tasks directory does not exist:", this.tasksDir);
      return summaries;
    }
    try {
      const entries = fs.readdirSync(this.tasksDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }
        const conversationId = entry.name;
        const conversationDir = path.join(this.tasksDir, conversationId);
        try {
          const summary = this.getTaskSummary(conversationId, conversationDir);
          if (summary) {
            summaries.push(summary);
          }
        } catch (err) {
          this.log("Error reading task set:", conversationId, err);
        }
      }
    } catch (err) {
      this.log("Error scanning tasks directory:", err);
    }
    summaries.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    this.log(`Found ${summaries.length} task sets`);
    return summaries;
  }
  /**
   * Get summary for a conversation's tasks
   */
  getTaskSummary(conversationId, conversationDir) {
    const tasks = this.readTasksFromDir(conversationDir);
    if (tasks.length === 0) {
      return null;
    }
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let lastModified = /* @__PURE__ */ new Date(0);
    for (const task of tasks) {
      switch (task.status) {
        case "pending":
          pending++;
          break;
        case "in_progress":
          inProgress++;
          break;
        case "completed":
          completed++;
          break;
      }
    }
    try {
      const files = fs.readdirSync(conversationDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(conversationDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime > lastModified) {
            lastModified = stats.mtime;
          }
        }
      }
    } catch (err) {
      this.log("Error getting last modified time:", err);
      lastModified = /* @__PURE__ */ new Date();
    }
    return {
      conversationId,
      taskCount: tasks.length,
      pending,
      inProgress,
      completed,
      lastModified
    };
  }
  /**
   * Read all task JSON files from a conversation directory
   */
  readTasksFromDir(conversationDir) {
    const tasks = [];
    try {
      const files = fs.readdirSync(conversationDir);
      for (const file of files) {
        if (!file.endsWith(".json") || file === ".lock") {
          continue;
        }
        const filePath = path.join(conversationDir, file);
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const task = JSON.parse(content);
          if (task.id && task.subject && task.status) {
            task.blocks = task.blocks || [];
            task.blockedBy = task.blockedBy || [];
            task.description = task.description || "";
            task.activeForm = task.activeForm || "";
            tasks.push(task);
          }
        } catch (err) {
          this.log("Error reading task file:", filePath, err);
        }
      }
    } catch (err) {
      this.log("Error reading conversation directory:", conversationDir, err);
    }
    tasks.sort((a, b) => {
      const aNum = parseInt(a.id, 10);
      const bNum = parseInt(b.id, 10);
      if (isNaN(aNum) || isNaN(bNum)) {
        return a.id.localeCompare(b.id);
      }
      return aNum - bNum;
    });
    return tasks;
  }
  /**
   * Get all tasks for a specific conversation
   * @param conversationId The conversation UUID
   * @returns Array of tasks, or empty array if not found
   */
  getTasksForConversation(conversationId) {
    const sanitized = path.basename(conversationId);
    const conversationDir = path.join(this.tasksDir, sanitized);
    if (!fs.existsSync(conversationDir)) {
      this.log("Conversation tasks directory not found:", conversationDir);
      return [];
    }
    return this.readTasksFromDir(conversationDir);
  }
  /**
   * Get a specific task from a conversation
   * @param conversationId The conversation UUID
   * @param taskId The task ID
   * @returns The task, or null if not found
   */
  getTask(conversationId, taskId) {
    const tasks = this.getTasksForConversation(conversationId);
    return tasks.find((t) => t.id === taskId) || null;
  }
  /**
   * Get the full TaskSet for a conversation
   * @param conversationId The conversation UUID
   * @returns TaskSet with all tasks and metadata, or null if not found
   */
  getTaskSet(conversationId) {
    const sanitized = path.basename(conversationId);
    const conversationDir = path.join(this.tasksDir, sanitized);
    if (!fs.existsSync(conversationDir)) {
      return null;
    }
    const tasks = this.readTasksFromDir(conversationDir);
    if (tasks.length === 0) {
      return null;
    }
    let lastModified = /* @__PURE__ */ new Date(0);
    try {
      const files = fs.readdirSync(conversationDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(conversationDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime > lastModified) {
            lastModified = stats.mtime;
          }
        }
      }
    } catch (err) {
      this.log("Error getting last modified time:", err);
      lastModified = /* @__PURE__ */ new Date();
    }
    return {
      conversationId: sanitized,
      tasks,
      lastModified
    };
  }
}
function serializeTaskSummary(summary) {
  return {
    ...summary,
    lastModified: summary.lastModified.toISOString()
  };
}
function serializeTask(task) {
  return {
    id: task.id,
    subject: task.subject,
    description: task.description,
    activeForm: task.activeForm,
    status: task.status,
    blocks: task.blocks,
    blockedBy: task.blockedBy
  };
}
function serializeTaskSet(taskSet) {
  return {
    conversationId: taskSet.conversationId,
    tasks: taskSet.tasks.map(serializeTask),
    lastModified: taskSet.lastModified.toISOString()
  };
}
const getTaskSummaries_createServerFn_handler = createServerRpc({
  id: "0587b41053374c52926570f3181752716da6ab43b5a3dfecc4784e8d2d07bed2",
  name: "getTaskSummaries",
  filename: "src/server/tasks.ts"
}, (opts, signal) => getTaskSummaries.__executeServer(opts, signal));
const getTaskSummaries = createServerFn({
  method: "GET"
}).handler(getTaskSummaries_createServerFn_handler, async () => {
  const reader = new TaskReader();
  const summaries = reader.scanTaskSets();
  return {
    taskSets: summaries.map(serializeTaskSummary),
    total: summaries.length
  };
});
const getTasksForConversation_createServerFn_handler = createServerRpc({
  id: "86ba43f8fc73ef9aac25b2640582873705569218c018298b70cc130cae503bd0",
  name: "getTasksForConversation",
  filename: "src/server/tasks.ts"
}, (opts, signal) => getTasksForConversation.__executeServer(opts, signal));
const getTasksForConversation = createServerFn({
  method: "GET"
}).handler(getTasksForConversation_createServerFn_handler, async (ctx) => {
  const conversationId = ctx.data;
  const reader = new TaskReader();
  const taskSet = reader.getTaskSet(conversationId);
  return {
    taskSet: taskSet ? serializeTaskSet(taskSet) : null,
    conversationId
  };
});
export {
  getTaskSummaries_createServerFn_handler,
  getTasksForConversation_createServerFn_handler
};
