import { filterUserConversation } from '../utils/transcriptFilters.js';
/**
 * Filter entries based on system entries toggle.
 * Uses the canonical filterUserConversation utility for consistency.
 */
function filterEntries(entries, showSystemEntries) {
    return showSystemEntries ? entries : filterUserConversation(entries);
}
/**
 * Get visible entries (respecting seen count limit)
 */
function getVisibleEntries(entries, seenFilteredCount, showSystemEntries) {
    const filtered = filterEntries(entries, showSystemEntries);
    return filtered.slice(0, seenFilteredCount);
}
/**
 * Find index of entry by UUID in filtered list
 */
function findIndexByUuid(entries, uuid, showSystemEntries) {
    if (!uuid)
        return 0;
    const filtered = filterEntries(entries, showSystemEntries);
    const index = filtered.findIndex((e) => e.uuid === uuid);
    return index >= 0 ? index : 0;
}
export const initialState = {
    entries: [],
    seenFilteredCount: 0,
    showSystemEntries: false,
    selectedUuid: null,
};
export function transcriptReducer(state, action) {
    switch (action.type) {
        case 'LOAD_TRANSCRIPT': {
            const filtered = filterEntries(action.entries, state.showSystemEntries);
            const lastIndex = Math.max(0, filtered.length - 1);
            return {
                ...state,
                entries: action.entries,
                seenFilteredCount: filtered.length,
                // Use initialSelectedUuid if provided (restoring position), otherwise default to last entry
                selectedUuid: action.initialSelectedUuid || filtered[lastIndex]?.uuid || null,
            };
        }
        case 'APPEND_ENTRIES': {
            const newEntries = [...state.entries, ...action.entries];
            // Don't change seenFilteredCount - new entries stay hidden
            // Don't change selectedUuid - user stays at current position
            return {
                ...state,
                entries: newEntries,
            };
        }
        case 'TOGGLE_SYSTEM_ENTRIES': {
            const newShowSystem = !state.showSystemEntries;
            // Calculate new filtered count
            const newFiltered = filterEntries(state.entries, newShowSystem);
            const newSeenCount = newFiltered.length;
            // Keep the same selectedUuid - it will be preserved across filter changes
            return {
                ...state,
                showSystemEntries: newShowSystem,
                seenFilteredCount: newSeenCount,
                selectedUuid: state.selectedUuid,
            };
        }
        case 'NAVIGATE_UP': {
            const visible = getVisibleEntries(state.entries, state.seenFilteredCount, state.showSystemEntries);
            // Find current index from UUID
            const currentIndex = visible.findIndex((e) => e.uuid === state.selectedUuid);
            const newIndex = Math.max(0, currentIndex - 1);
            // No change - return existing state to avoid flicker
            if (newIndex === currentIndex || currentIndex < 0) {
                return state;
            }
            return {
                ...state,
                selectedUuid: visible[newIndex]?.uuid || state.selectedUuid,
            };
        }
        case 'NAVIGATE_DOWN': {
            const filtered = filterEntries(state.entries, state.showSystemEntries);
            const visible = getVisibleEntries(state.entries, state.seenFilteredCount, state.showSystemEntries);
            // Find current index from UUID
            const currentIndex = visible.findIndex((e) => e.uuid === state.selectedUuid);
            const atBottom = currentIndex === visible.length - 1;
            const hasHiddenEntries = filtered.length > state.seenFilteredCount;
            if (atBottom && hasHiddenEntries) {
                // At bottom with hidden entries - reveal them and advance
                const newSeenCount = filtered.length;
                const newIndex = currentIndex + 1;
                return {
                    ...state,
                    seenFilteredCount: newSeenCount,
                    selectedUuid: filtered[newIndex]?.uuid || state.selectedUuid,
                };
            }
            else {
                // Normal navigation within visible entries
                const newIndex = Math.min(visible.length - 1, currentIndex + 1);
                // No change - return existing state to avoid flicker
                if (newIndex === currentIndex || currentIndex < 0) {
                    return state;
                }
                return {
                    ...state,
                    selectedUuid: visible[newIndex]?.uuid || state.selectedUuid,
                };
            }
        }
        case 'JUMP_TO_LATEST': {
            const filtered = filterEntries(state.entries, state.showSystemEntries);
            const lastIndex = Math.max(0, filtered.length - 1);
            const lastUuid = filtered[lastIndex]?.uuid;
            // Already at latest with all visible - return existing state to avoid flicker
            if (state.selectedUuid === lastUuid &&
                state.seenFilteredCount === filtered.length) {
                return state;
            }
            return {
                ...state,
                seenFilteredCount: filtered.length,
                selectedUuid: lastUuid || state.selectedUuid,
            };
        }
        default:
            return state;
    }
}
/**
 * Selector: Get filtered entries
 */
export function getFilteredEntries(state) {
    return filterEntries(state.entries, state.showSystemEntries);
}
/**
 * Selector: Get visible entries (respecting seen count)
 */
export function getVisibleEntriesFromState(state) {
    return getVisibleEntries(state.entries, state.seenFilteredCount, state.showSystemEntries);
}
/**
 * Selector: Get new entries count
 */
export function getNewEntriesCount(state) {
    const filtered = filterEntries(state.entries, state.showSystemEntries);
    return Math.max(0, filtered.length - state.seenFilteredCount);
}
//# sourceMappingURL=transcriptReducer.js.map