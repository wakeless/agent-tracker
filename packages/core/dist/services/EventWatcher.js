import fs from 'fs';
import { homedir } from 'os';
import { join } from 'path';
export class EventWatcher {
    logPath;
    handler;
    watcher = null;
    lastPosition = 0;
    isReading = false;
    constructor(handler, options) {
        // Support both old API (string) and new API (options object)
        if (typeof options === 'string') {
            // Legacy: logDir as string
            this.logPath = join(options, 'sessions.jsonl');
        }
        else if (options?.logPath) {
            // New: full path to events file
            this.logPath = options.logPath;
        }
        else if (options?.logDir) {
            // New: directory path
            this.logPath = join(options.logDir, 'sessions.jsonl');
        }
        else {
            // Default: ~/.agent-tracker/sessions.jsonl
            const baseDir = join(homedir(), '.agent-tracker');
            this.logPath = join(baseDir, 'sessions.jsonl');
        }
        this.handler = handler;
    }
    /**
     * Start watching the event log file for new events
     */
    start() {
        // Ensure the log directory exists
        const logDir = join(this.logPath, '..');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        // Create the log file if it doesn't exist
        if (!fs.existsSync(this.logPath)) {
            fs.writeFileSync(this.logPath, '');
        }
        // Read any existing events first
        this.readNewEvents();
        // Watch for changes to the file
        this.watcher = fs.watch(this.logPath, (eventType) => {
            if (eventType === 'change') {
                this.readNewEvents();
            }
        });
    }
    /**
     * Stop watching the event log file
     */
    stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
    /**
     * Manually trigger reading new events (useful for testing)
     */
    readNewEvents() {
        // Prevent concurrent reads
        if (this.isReading) {
            return;
        }
        this.isReading = true;
        try {
            const stats = fs.statSync(this.logPath);
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
            const fd = fs.openSync(this.logPath, 'r');
            fs.readSync(fd, buffer, 0, buffer.length, this.lastPosition);
            fs.closeSync(fd);
            // Update position for next read
            this.lastPosition = stats.size;
            // Parse and process each line
            const content = buffer.toString('utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            for (const line of lines) {
                try {
                    const event = JSON.parse(line);
                    this.handleEvent(event);
                }
                catch (error) {
                    if (this.handler.onError) {
                        this.handler.onError(new Error(`Failed to parse event: ${line}`));
                    }
                }
            }
        }
        catch (error) {
            if (this.handler.onError) {
                this.handler.onError(error);
            }
        }
        finally {
            this.isReading = false;
        }
    }
    /**
     * Handle a parsed event by dispatching to the appropriate handler
     */
    handleEvent(event) {
        try {
            if (event.event_type === 'session_start') {
                this.handler.onSessionStart(event);
            }
            else if (event.event_type === 'session_end') {
                this.handler.onSessionEnd(event);
            }
            else if (event.event_type === 'activity' && this.handler.onActivity) {
                this.handler.onActivity(event);
            }
        }
        catch (error) {
            if (this.handler.onError) {
                this.handler.onError(error);
            }
        }
    }
    /**
     * Get the path to the log file being watched
     */
    getLogPath() {
        return this.logPath;
    }
    /**
     * Check if the log file exists
     */
    fileExists() {
        return fs.existsSync(this.logPath);
    }
}
//# sourceMappingURL=EventWatcher.js.map