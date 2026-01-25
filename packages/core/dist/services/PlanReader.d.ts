/**
 * PlanReader
 *
 * Reads plan files from ~/.claude/plans/ directory.
 * Plans are markdown files with a consistent structure:
 * - H1 title (# Plan: <title>)
 * - H2 sections for organization
 * - Code blocks, tables, and lists
 */
/**
 * Metadata for a plan file
 */
export interface PlanFile {
    /** Filename without path, e.g., "frolicking-baking-cat.md" */
    filename: string;
    /** Full absolute path to the file */
    path: string;
    /** Title extracted from H1 heading, or filename if no H1 found */
    title: string;
    /** File modification time */
    modified: Date;
    /** File size in bytes */
    size: number;
}
export interface PlanReaderOptions {
    /** Directory containing plan files. Default: ~/.claude/plans/ */
    plansDir?: string;
    /** Enable debug logging */
    enableLogging?: boolean;
}
/**
 * PlanReader
 *
 * Scans and reads plan files from the Claude plans directory.
 */
export declare class PlanReader {
    private plansDir;
    private enableLogging;
    constructor(options?: PlanReaderOptions);
    private log;
    /**
     * Extract title from markdown content by finding the first H1 heading.
     * Returns the filename (without .md) if no H1 is found.
     */
    private extractTitle;
    /**
     * Check if the plans directory exists
     */
    plansExist(): boolean;
    /**
     * Scan the plans directory and return metadata for all plan files
     */
    scanPlans(): PlanFile[];
    /**
     * Read the full content of a plan file
     * @param filename The filename (not full path) of the plan to read
     * @returns The file content as a string, or null if not found
     */
    readPlan(filename: string): string | null;
    /**
     * Get the plans directory path
     */
    getPlansDir(): string;
}
//# sourceMappingURL=PlanReader.d.ts.map