import { ParsedTranscriptEntry } from '../types/transcript.js';
/**
 * Filters transcript entries to show only user conversation.
 * Removes system messages (sidechain, thinking, meta, file-history, etc.)
 * and tool results.
 *
 * This is the canonical filter for displaying conversation to users.
 * Use this consistently across all components that display transcript entries.
 */
export declare function filterUserConversation(entries: ParsedTranscriptEntry[]): ParsedTranscriptEntry[];
/**
 * Gets the most recent N conversation entries, excluding system messages.
 */
export declare function getRecentConversation(entries: ParsedTranscriptEntry[], limit?: number): ParsedTranscriptEntry[];
//# sourceMappingURL=transcriptFilters.d.ts.map