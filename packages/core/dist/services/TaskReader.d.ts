/**
 * TaskReader
 *
 * Reads task files from ~/.claude/tasks/ directory.
 * Tasks are stored per-conversation in JSON files:
 * ~/.claude/tasks/{conversation-uuid}/1.json, 2.json, etc.
 */
import { Task, TaskSet, TaskSummary } from '../types/task.js';
export interface TaskReaderOptions {
    /** Directory containing task sets. Default: ~/.claude/tasks/ */
    tasksDir?: string;
    /** Enable debug logging */
    enableLogging?: boolean;
}
/**
 * TaskReader
 *
 * Scans and reads task files from the Claude tasks directory.
 */
export declare class TaskReader {
    private tasksDir;
    private enableLogging;
    constructor(options?: TaskReaderOptions);
    private log;
    /**
     * Check if the tasks directory exists
     */
    tasksExist(): boolean;
    /**
     * Get the tasks directory path
     */
    getTasksDir(): string;
    /**
     * Scan the tasks directory and return summaries for all conversation task sets
     */
    scanTaskSets(): TaskSummary[];
    /**
     * Get summary for a conversation's tasks
     */
    private getTaskSummary;
    /**
     * Read all task JSON files from a conversation directory
     */
    private readTasksFromDir;
    /**
     * Get all tasks for a specific conversation
     * @param conversationId The conversation UUID
     * @returns Array of tasks, or empty array if not found
     */
    getTasksForConversation(conversationId: string): Task[];
    /**
     * Get a specific task from a conversation
     * @param conversationId The conversation UUID
     * @param taskId The task ID
     * @returns The task, or null if not found
     */
    getTask(conversationId: string, taskId: string): Task | null;
    /**
     * Get the full TaskSet for a conversation
     * @param conversationId The conversation UUID
     * @returns TaskSet with all tasks and metadata, or null if not found
     */
    getTaskSet(conversationId: string): TaskSet | null;
    /**
     * Extract conversation UUID from a transcript path.
     * Transcript paths follow the pattern: ~/.claude/projects/{project-path}/{uuid}.jsonl
     * @param transcriptPath Full path to the transcript file
     * @returns The conversation UUID, or null if not extractable
     */
    extractConversationId(transcriptPath: string): string | null;
    /**
     * Get task summary for a session based on its transcript path.
     * This correlates session transcripts with their task sets.
     * @param transcriptPath Full path to the session's transcript file
     * @returns TaskSummary if tasks exist for this session, null otherwise
     */
    getTaskSummaryForSession(transcriptPath: string): TaskSummary | null;
    /**
     * Get all tasks for a session based on its transcript path.
     * @param transcriptPath Full path to the session's transcript file
     * @returns Array of tasks, or empty array if not found
     */
    getTasksForSession(transcriptPath: string): Task[];
}
//# sourceMappingURL=TaskReader.d.ts.map