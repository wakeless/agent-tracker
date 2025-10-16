import { ParsedTranscriptEntry } from '../types/transcript.js';

export interface TranscriptState {
  entries: ParsedTranscriptEntry[];
  selectedIndex: number;
  seenFilteredCount: number;
  showSystemEntries: boolean;
  selectedUuid: string | null;
}

export type TranscriptAction =
  | { type: 'LOAD_TRANSCRIPT'; entries: ParsedTranscriptEntry[] }
  | { type: 'APPEND_ENTRIES'; entries: ParsedTranscriptEntry[] }
  | { type: 'TOGGLE_SYSTEM_ENTRIES' }
  | { type: 'NAVIGATE_UP' }
  | { type: 'NAVIGATE_DOWN' }
  | { type: 'JUMP_TO_LATEST' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

/**
 * Filter entries based on system entries toggle
 */
function filterEntries(
  entries: ParsedTranscriptEntry[],
  showSystemEntries: boolean
): ParsedTranscriptEntry[] {
  return showSystemEntries
    ? entries
    : entries.filter(
        (e) =>
          e.type !== 'system' &&
          e.type !== 'file-history' &&
          e.type !== 'meta' &&
          e.type !== 'tool_result'
      );
}

/**
 * Get visible entries (respecting seen count limit)
 */
function getVisibleEntries(
  entries: ParsedTranscriptEntry[],
  seenFilteredCount: number,
  showSystemEntries: boolean
): ParsedTranscriptEntry[] {
  const filtered = filterEntries(entries, showSystemEntries);
  return filtered.slice(0, seenFilteredCount);
}

/**
 * Find index of entry by UUID in filtered list
 */
function findIndexByUuid(
  entries: ParsedTranscriptEntry[],
  uuid: string | null,
  showSystemEntries: boolean
): number {
  if (!uuid) return 0;
  const filtered = filterEntries(entries, showSystemEntries);
  const index = filtered.findIndex((e) => e.uuid === uuid);
  return index >= 0 ? index : 0;
}

export const initialState: TranscriptState = {
  entries: [],
  selectedIndex: 0,
  seenFilteredCount: 0,
  showSystemEntries: false,
  selectedUuid: null,
};

export function transcriptReducer(
  state: TranscriptState,
  action: TranscriptAction
): TranscriptState {
  switch (action.type) {
    case 'LOAD_TRANSCRIPT': {
      const filtered = filterEntries(action.entries, state.showSystemEntries);
      const lastIndex = Math.max(0, filtered.length - 1);

      return {
        ...state,
        entries: action.entries,
        seenFilteredCount: filtered.length,
        selectedIndex: lastIndex,
        selectedUuid: filtered[lastIndex]?.uuid || null,
      };
    }

    case 'APPEND_ENTRIES': {
      const newEntries = [...state.entries, ...action.entries];
      // Don't change seenFilteredCount - new entries stay hidden
      // Don't change selectedIndex - user stays at current position

      return {
        ...state,
        entries: newEntries,
      };
    }

    case 'TOGGLE_SYSTEM_ENTRIES': {
      const newShowSystem = !state.showSystemEntries;

      // Get currently selected entry to preserve position
      const currentVisible = getVisibleEntries(
        state.entries,
        state.seenFilteredCount,
        state.showSystemEntries
      );
      const currentUuid = currentVisible[state.selectedIndex]?.uuid || state.selectedUuid;

      // Calculate new filtered count
      const newFiltered = filterEntries(state.entries, newShowSystem);
      const newSeenCount = newFiltered.length;

      // Find the same entry in the new filtered list
      const newIndex = findIndexByUuid(state.entries, currentUuid, newShowSystem);

      return {
        ...state,
        showSystemEntries: newShowSystem,
        seenFilteredCount: newSeenCount,
        selectedIndex: Math.min(newIndex, newSeenCount - 1),
        selectedUuid: currentUuid,
      };
    }

    case 'NAVIGATE_UP': {
      const newIndex = Math.max(0, state.selectedIndex - 1);

      // No change - return existing state to avoid flicker
      if (newIndex === state.selectedIndex) {
        return state;
      }

      const visible = getVisibleEntries(
        state.entries,
        state.seenFilteredCount,
        state.showSystemEntries
      );

      return {
        ...state,
        selectedIndex: newIndex,
        selectedUuid: visible[newIndex]?.uuid || state.selectedUuid,
      };
    }

    case 'NAVIGATE_DOWN': {
      const filtered = filterEntries(state.entries, state.showSystemEntries);
      const visible = getVisibleEntries(
        state.entries,
        state.seenFilteredCount,
        state.showSystemEntries
      );
      const currentVisible = visible.length;
      const atBottom = state.selectedIndex === currentVisible - 1;
      const hasHiddenEntries = filtered.length > state.seenFilteredCount;

      if (atBottom && hasHiddenEntries) {
        // At bottom with hidden entries - reveal them and advance
        const newSeenCount = filtered.length;
        const newIndex = state.selectedIndex + 1;

        return {
          ...state,
          seenFilteredCount: newSeenCount,
          selectedIndex: newIndex,
          selectedUuid: filtered[newIndex]?.uuid || state.selectedUuid,
        };
      } else {
        // Normal navigation within visible entries
        const newIndex = Math.min(currentVisible - 1, state.selectedIndex + 1);

        // No change - return existing state to avoid flicker
        if (newIndex === state.selectedIndex) {
          return state;
        }

        return {
          ...state,
          selectedIndex: newIndex,
          selectedUuid: visible[newIndex]?.uuid || state.selectedUuid,
        };
      }
    }

    case 'JUMP_TO_LATEST': {
      const filtered = filterEntries(state.entries, state.showSystemEntries);
      const lastIndex = Math.max(0, filtered.length - 1);

      // Already at latest with all visible - return existing state to avoid flicker
      if (
        state.selectedIndex === lastIndex &&
        state.seenFilteredCount === filtered.length
      ) {
        return state;
      }

      return {
        ...state,
        seenFilteredCount: filtered.length,
        selectedIndex: lastIndex,
        selectedUuid: filtered[lastIndex]?.uuid || state.selectedUuid,
      };
    }

    default:
      return state;
  }
}

/**
 * Selector: Get filtered entries
 */
export function getFilteredEntries(state: TranscriptState): ParsedTranscriptEntry[] {
  return filterEntries(state.entries, state.showSystemEntries);
}

/**
 * Selector: Get visible entries (respecting seen count)
 */
export function getVisibleEntriesFromState(state: TranscriptState): ParsedTranscriptEntry[] {
  return getVisibleEntries(state.entries, state.seenFilteredCount, state.showSystemEntries);
}

/**
 * Selector: Get new entries count
 */
export function getNewEntriesCount(state: TranscriptState): number {
  const filtered = filterEntries(state.entries, state.showSystemEntries);
  return Math.max(0, filtered.length - state.seenFilteredCount);
}
