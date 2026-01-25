/**
 * TaskReader
 *
 * Reads task files from ~/.claude/tasks/ directory.
 * Tasks are stored per-conversation in JSON files:
 * ~/.claude/tasks/{conversation-uuid}/1.json, 2.json, etc.
 */
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
/**
 * TaskReader
 *
 * Scans and reads task files from the Claude tasks directory.
 */
export class TaskReader {
    tasksDir;
    enableLogging;
    constructor(options = {}) {
        this.tasksDir = options.tasksDir || path.join(homedir(), '.claude', 'tasks');
        this.enableLogging = options.enableLogging ?? false;
    }
    log(...args) {
        if (this.enableLogging) {
            console.log('[TaskReader]', ...args);
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
            this.log('Tasks directory does not exist:', this.tasksDir);
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
                }
                catch (err) {
                    this.log('Error reading task set:', conversationId, err);
                }
            }
        }
        catch (err) {
            this.log('Error scanning tasks directory:', err);
        }
        // Sort by modification time, newest first
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
        let lastModified = new Date(0);
        for (const task of tasks) {
            switch (task.status) {
                case 'pending':
                    pending++;
                    break;
                case 'in_progress':
                    inProgress++;
                    break;
                case 'completed':
                    completed++;
                    break;
            }
        }
        // Get last modified time from directory
        try {
            const files = fs.readdirSync(conversationDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(conversationDir, file);
                    const stats = fs.statSync(filePath);
                    if (stats.mtime > lastModified) {
                        lastModified = stats.mtime;
                    }
                }
            }
        }
        catch (err) {
            this.log('Error getting last modified time:', err);
            lastModified = new Date();
        }
        return {
            conversationId,
            taskCount: tasks.length,
            pending,
            inProgress,
            completed,
            lastModified,
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
                // Skip non-JSON files and lock files
                if (!file.endsWith('.json') || file === '.lock') {
                    continue;
                }
                const filePath = path.join(conversationDir, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const task = JSON.parse(content);
                    // Validate task has required fields
                    if (task.id && task.subject && task.status) {
                        // Ensure arrays exist
                        task.blocks = task.blocks || [];
                        task.blockedBy = task.blockedBy || [];
                        task.description = task.description || '';
                        task.activeForm = task.activeForm || '';
                        tasks.push(task);
                    }
                }
                catch (err) {
                    this.log('Error reading task file:', filePath, err);
                }
            }
        }
        catch (err) {
            this.log('Error reading conversation directory:', conversationDir, err);
        }
        // Sort by task ID numerically
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
        // Sanitize to prevent path traversal
        const sanitized = path.basename(conversationId);
        const conversationDir = path.join(this.tasksDir, sanitized);
        if (!fs.existsSync(conversationDir)) {
            this.log('Conversation tasks directory not found:', conversationDir);
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
        return tasks.find(t => t.id === taskId) || null;
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
        // Get last modified time
        let lastModified = new Date(0);
        try {
            const files = fs.readdirSync(conversationDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(conversationDir, file);
                    const stats = fs.statSync(filePath);
                    if (stats.mtime > lastModified) {
                        lastModified = stats.mtime;
                    }
                }
            }
        }
        catch (err) {
            this.log('Error getting last modified time:', err);
            lastModified = new Date();
        }
        return {
            conversationId: sanitized,
            tasks,
            lastModified,
        };
    }
    /**
     * Extract conversation UUID from a transcript path.
     * Transcript paths follow the pattern: ~/.claude/projects/{project-path}/{uuid}.jsonl
     * @param transcriptPath Full path to the transcript file
     * @returns The conversation UUID, or null if not extractable
     */
    extractConversationId(transcriptPath) {
        const basename = path.basename(transcriptPath);
        // Remove .jsonl extension
        if (basename.endsWith('.jsonl')) {
            return basename.slice(0, -6);
        }
        return null;
    }
    /**
     * Get task summary for a session based on its transcript path.
     * This correlates session transcripts with their task sets.
     * @param transcriptPath Full path to the session's transcript file
     * @returns TaskSummary if tasks exist for this session, null otherwise
     */
    getTaskSummaryForSession(transcriptPath) {
        const conversationId = this.extractConversationId(transcriptPath);
        if (!conversationId) {
            return null;
        }
        const conversationDir = path.join(this.tasksDir, conversationId);
        if (!fs.existsSync(conversationDir)) {
            return null;
        }
        return this.getTaskSummary(conversationId, conversationDir);
    }
    /**
     * Get all tasks for a session based on its transcript path.
     * @param transcriptPath Full path to the session's transcript file
     * @returns Array of tasks, or empty array if not found
     */
    getTasksForSession(transcriptPath) {
        const conversationId = this.extractConversationId(transcriptPath);
        if (!conversationId) {
            return [];
        }
        return this.getTasksForConversation(conversationId);
    }
}
//# sourceMappingURL=TaskReader.js.map