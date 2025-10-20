// Claude transcript types based on JSONL format
/**
 * Identifies if a transcript entry is a system message.
 * System messages include:
 * - Sidechain messages (warmup, etc.)
 * - System type entries
 * - Meta messages
 *
 * Note: This checks the raw TranscriptEntry.
 * For parsed entries, check if ParsedTranscriptEntry.isSystemMessage is true
 * or if type is 'thinking', 'system', 'meta', or 'file-history'
 */
export function isSystemMessage(entry) {
    return (entry.isSidechain === true ||
        entry.type === 'system' ||
        entry.isMeta === true);
}
//# sourceMappingURL=transcript.js.map