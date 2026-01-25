import { EventHandler } from '../types/events.js';
export interface EventWatcherOptions {
    logDir?: string;
    logPath?: string;
}
export declare class EventWatcher {
    private logPath;
    private handler;
    private watcher;
    private lastPosition;
    private isReading;
    constructor(handler: EventHandler, options?: string | EventWatcherOptions);
    /**
     * Start watching the event log file for new events
     */
    start(): void;
    /**
     * Stop watching the event log file
     */
    stop(): void;
    /**
     * Manually trigger reading new events (useful for testing)
     */
    readNewEvents(): void;
    /**
     * Handle a parsed event by dispatching to the appropriate handler
     */
    private handleEvent;
    /**
     * Get the path to the log file being watched
     */
    getLogPath(): string;
    /**
     * Check if the log file exists
     */
    fileExists(): boolean;
}
//# sourceMappingURL=EventWatcher.d.ts.map