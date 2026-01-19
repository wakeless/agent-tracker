import { ParsedTranscriptEntry } from '../types/transcript.js';
export interface TranscriptWatcherOptions {
    onNewEntries: (entries: ParsedTranscriptEntry[]) => void;
    onError?: (error: Error) => void;
}
/**
 * Watches a Claude Code transcript file for new entries and notifies when changes occur.
 * Similar to EventWatcher but specialized for transcript JSONL files.
 */
export declare class TranscriptWatcher {
    private transcriptPath;
    private options;
    private watcher;
    private lastPosition;
    private isReading;
    private reader;
    private retryTimeout;
    constructor(transcriptPath: string, options: TranscriptWatcherOptions);
    /**
     * Start watching the transcript file for new entries
     */
    start(): void;
    /**
     * Stop watching the transcript file
     */
    stop(): void;
    /**
     * Establish baseline by reading to end of file without emitting entries
     */
    private establishBaseline;
    /**
     * Read and process only new entries since last read
     */
    readNewEntries(): void;
    /**
     * Get the path to the transcript file being watched
     */
    getTranscriptPath(): string;
}
//# sourceMappingURL=TranscriptWatcher.d.ts.map