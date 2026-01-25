/**
 * PlanReader
 *
 * Reads plan files from ~/.claude/plans/ directory.
 * Plans are markdown files with a consistent structure:
 * - H1 title (# Plan: <title>)
 * - H2 sections for organization
 * - Code blocks, tables, and lists
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

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
export class PlanReader {
  private plansDir: string;
  private enableLogging: boolean;

  constructor(options: PlanReaderOptions = {}) {
    this.plansDir = options.plansDir || path.join(homedir(), '.claude', 'plans');
    this.enableLogging = options.enableLogging ?? false;
  }

  private log(...args: unknown[]): void {
    if (this.enableLogging) {
      console.log('[PlanReader]', ...args);
    }
  }

  /**
   * Extract title from markdown content by finding the first H1 heading.
   * Returns the filename (without .md) if no H1 is found.
   */
  private extractTitle(content: string, filename: string): string {
    // Look for # heading at start of line
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
      let title = match[1].trim();
      // Remove "Plan:" prefix if present
      if (title.toLowerCase().startsWith('plan:')) {
        title = title.substring(5).trim();
      }
      return title;
    }
    // Fallback to filename without extension
    return filename.replace(/\.md$/i, '');
  }

  /**
   * Check if the plans directory exists
   */
  plansExist(): boolean {
    return fs.existsSync(this.plansDir);
  }

  /**
   * Scan the plans directory and return metadata for all plan files
   */
  scanPlans(): PlanFile[] {
    const plans: PlanFile[] = [];

    if (!this.plansExist()) {
      this.log('Plans directory does not exist:', this.plansDir);
      return plans;
    }

    try {
      const files = fs.readdirSync(this.plansDir, { withFileTypes: true });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith('.md')) {
          continue;
        }

        const filePath = path.join(this.plansDir, file.name);

        try {
          const stats = fs.statSync(filePath);
          // Read just the first 1KB to extract title
          const fd = fs.openSync(filePath, 'r');
          const buffer = Buffer.alloc(1024);
          const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
          fs.closeSync(fd);

          const headerContent = buffer.toString('utf-8', 0, bytesRead);
          const title = this.extractTitle(headerContent, file.name);

          plans.push({
            filename: file.name,
            path: filePath,
            title,
            modified: stats.mtime,
            size: stats.size,
          });
        } catch (err) {
          this.log('Error reading plan file:', filePath, err);
        }
      }
    } catch (err) {
      this.log('Error scanning plans directory:', err);
    }

    // Sort by modification time, newest first
    plans.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    this.log(`Found ${plans.length} plan files`);
    return plans;
  }

  /**
   * Read the full content of a plan file
   * @param filename The filename (not full path) of the plan to read
   * @returns The file content as a string, or null if not found
   */
  readPlan(filename: string): string | null {
    // Sanitize filename to prevent path traversal
    const sanitized = path.basename(filename);
    const filePath = path.join(this.plansDir, sanitized);

    if (!fs.existsSync(filePath)) {
      this.log('Plan file not found:', filePath);
      return null;
    }

    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      this.log('Error reading plan file:', filePath, err);
      return null;
    }
  }

  /**
   * Get the plans directory path
   */
  getPlansDir(): string {
    return this.plansDir;
  }
}
