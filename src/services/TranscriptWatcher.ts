import fs from 'fs';
import { TranscriptReader } from './TranscriptReader.js';
import { TranscriptEntry, ParsedTranscriptEntry } from '../types/transcript.js';

export interface TranscriptWatcherOptions {
  onNewEntries: (entries: ParsedTranscriptEntry[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Watches a Claude Code transcript file for new entries and notifies when changes occur.
 * Similar to EventWatcher but specialized for transcript JSONL files.
 */
export class TranscriptWatcher {
  private transcriptPath: string;
  private options: TranscriptWatcherOptions;
  private watcher: fs.FSWatcher | null = null;
  private lastPosition = 0;
  private isReading = false;
  private reader: TranscriptReader;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(transcriptPath: string, options: TranscriptWatcherOptions) {
    this.transcriptPath = transcriptPath;
    this.options = options;
    this.reader = new TranscriptReader();
  }

  /**
   * Start watching the transcript file for new entries
   */
  start(): void {
    // Check if file exists
    if (!fs.existsSync(this.transcriptPath)) {
      // File doesn't exist yet (active session, transcript not created)
      // Retry after a short delay
      this.retryTimeout = setTimeout(() => this.start(), 1000);
      return;
    }

    // Read any existing content first to establish baseline
    this.establishBaseline();

    // Watch for changes to the file
    try {
      this.watcher = fs.watch(this.transcriptPath, (eventType) => {
        if (eventType === 'change') {
          this.readNewEntries();
        }
      });
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
    }
  }

  /**
   * Stop watching the transcript file
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Establish baseline by reading to end of file without emitting entries
   */
  private establishBaseline(): void {
    try {
      const stats = fs.statSync(this.transcriptPath);
      this.lastPosition = stats.size;
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
    }
  }

  /**
   * Read and process only new entries since last read
   */
  readNewEntries(): void {
    // Prevent concurrent reads
    if (this.isReading) {
      return;
    }

    this.isReading = true;

    try {
      const stats = fs.statSync(this.transcriptPath);

      // If file was truncated or recreated, reset position
      if (stats.size < this.lastPosition) {
        this.lastPosition = 0;
      }

      // If no new data, skip
      if (stats.size === this.lastPosition) {
        this.isReading = false;
        return;
      }

      // Read only the new portion of the file
      const buffer = Buffer.alloc(stats.size - this.lastPosition);
      const fd = fs.openSync(this.transcriptPath, 'r');
      fs.readSync(fd, buffer, 0, buffer.length, this.lastPosition);
      fs.closeSync(fd);

      // Update position for next read
      this.lastPosition = stats.size;

      // Parse and process each line
      const content = buffer.toString('utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      const newEntries: ParsedTranscriptEntry[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as TranscriptEntry;
          const parsed = this.reader.parseEntry(entry);
          if (parsed) {
            newEntries.push(parsed);
          }
        } catch (error) {
          if (this.options.onError) {
            this.options.onError(new Error(`Failed to parse transcript line: ${line}`));
          }
        }
      }

      // Notify about new entries
      if (newEntries.length > 0) {
        this.options.onNewEntries(newEntries);
      }
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
    } finally {
      this.isReading = false;
    }
  }

  /**
   * Get the path to the transcript file being watched
   */
  getTranscriptPath(): string {
    return this.transcriptPath;
  }
}
