/**
 * Filters transcript entries to show only user conversation.
 * Removes system messages (sidechain, thinking, meta, file-history, etc.)
 * and tool results.
 *
 * This is the canonical filter for displaying conversation to users.
 * Use this consistently across all components that display transcript entries.
 */
export function filterUserConversation(entries) {
    return entries.filter((entry) => !entry.isSystemMessage && // Filter out all system messages
        entry.type !== 'tool_result' // Also filter tool results
    );
}
/**
 * Gets the most recent N conversation entries, excluding system messages.
 */
export function getRecentConversation(entries, limit = 5) {
    const filtered = filterUserConversation(entries);
    return filtered.slice(-limit);
}
//# sourceMappingURL=transcriptFilters.js.map