import fs from 'fs';
import { TranscriptReader } from './TranscriptReader.js';
/**
 * Watches a Claude Code transcript file for new entries and notifies when changes occur.
 * Similar to EventWatcher but specialized for transcript JSONL files.
 */
export class TranscriptWatcher {
    transcriptPath;
    options;
    watcher = null;
    lastPosition = 0;
    isReading = false;
    reader;
    retryTimeout = null;
    constructor(transcriptPath, options) {
        this.transcriptPath = transcriptPath;
        this.options = options;
        this.reader = new TranscriptReader();
    }
    /**
     * Start watching the transcript file for new entries
     */
    start() {
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
        }
        catch (error) {
            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }
    /**
     * Stop watching the transcript file
     */
    stop() {
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
    establishBaseline() {
        try {
            const stats = fs.statSync(this.transcriptPath);
            this.lastPosition = stats.size;
        }
        catch (error) {
            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }
    /**
     * Read and process only new entries since last read
     */
    readNewEntries() {
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
            const newEntries = [];
            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    // Note: Watcher doesn't have access to upcoming entries for look-ahead
                    // Bash merging will happen on full transcript reload
                    const result = this.reader.parseEntry(entry);
                    if (result.parsed) {
                        newEntries.push(result.parsed);
                    }
                }
                catch (error) {
                    if (this.options.onError) {
                        this.options.onError(new Error(`Failed to parse transcript line: ${line}`));
                    }
                }
            }
            // Notify about new entries
            if (newEntries.length > 0) {
                this.options.onNewEntries(newEntries);
            }
        }
        catch (error) {
            if (this.options.onError) {
                this.options.onError(error);
            }
        }
        finally {
            this.isReading = false;
        }
    }
    /**
     * Get the path to the transcript file being watched
     */
    getTranscriptPath() {
        return this.transcriptPath;
    }
}
//# sourceMappingURL=TranscriptWatcher.js.map