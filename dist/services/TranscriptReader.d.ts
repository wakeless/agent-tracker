import { TranscriptEntry, ParsedTranscriptEntry } from '../types/transcript.js';
export declare class TranscriptReader {
    /**
     * Helper: Check if content contains bash-input tags
     */
    private isBashInput;
    /**
     * Helper: Check if content contains bash-stdout or bash-stderr tags
     */
    private isBashOutput;
    /**
     * Helper: Extract bash command from bash-input tags
     */
    private extractBashCommand;
    /**
     * Helper: Extract bash stdout from bash-stdout tags
     */
    private extractBashStdout;
    /**
     * Helper: Extract bash stderr from bash-stderr tags
     */
    private extractBashStderr;
    /**
     * Read and parse a transcript file
     */
    readTranscript(transcriptPath: string): Promise<ParsedTranscriptEntry[]>;
    /**
     * Get recent N entries from transcript
     */
    getRecentEntries(transcriptPath: string, limit?: number): Promise<ParsedTranscriptEntry[]>;
    /**
     * Parse a transcript entry into display format
     * @param entry - The current entry to parse
     * @param upcoming - Array of upcoming entries for look-ahead (up to 3 entries)
     * @returns Object with parsed entry and number of upcoming entries consumed
     */
    parseEntry(entry: TranscriptEntry, upcoming?: TranscriptEntry[]): {
        parsed: ParsedTranscriptEntry | null;
        consumed: number;
    };
    /**
     * Get the timestamp of the last entry in the transcript
     * Useful for tracking session activity
     */
    getLastEntryTimestamp(transcriptPath: string): Promise<Date | null>;
    /**
     * Read transcript synchronously for testing
     */
    readTranscriptSync(transcriptPath: string): ParsedTranscriptEntry[];
}
//# sourceMappingURL=TranscriptReader.d.ts.map