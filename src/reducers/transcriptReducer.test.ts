import { describe, it, expect } from 'vitest';
import {
  transcriptReducer,
  initialState,
  getFilteredEntries,
  getVisibleEntriesFromState,
  getNewEntriesCount,
  TranscriptState,
} from './transcriptReducer.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';

// Helper to create test entries
function createEntry(uuid: string, type: ParsedTranscriptEntry['type']): ParsedTranscriptEntry {
  return {
    uuid,
    type,
    content: `${type} content`,
    timestamp: new Date(),
  };
}

describe('transcriptReducer', () => {
  it('should load transcript and set initial state', () => {
    const entries: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'assistant'),
      createEntry('3', 'system'),
      createEntry('4', 'user'),
    ];

    const state = transcriptReducer(initialState, {
      type: 'LOAD_TRANSCRIPT',
      entries,
    });

    expect(state.entries).toHaveLength(4);
    // System entries hidden by default
    expect(state.seenFilteredCount).toBe(3); // user, assistant, user (no system)
    expect(state.selectedIndex).toBe(2); // Last visible entry
    expect(state.showSystemEntries).toBe(false);
  });

  it('should toggle system entries and preserve position by UUID', () => {
    // Setup initial state with mixed entries
    const entries: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'system'),
      createEntry('3', 'assistant'),
      createEntry('4', 'meta'),
      createEntry('5', 'user'),
    ];

    let state: TranscriptState = {
      ...initialState,
      entries,
      selectedIndex: 1, // Pointing to 'assistant' (index 1 in filtered, uuid '3')
      seenFilteredCount: 3, // user, assistant, user visible
      selectedUuid: '3',
      showSystemEntries: false,
    };

    // Toggle system entries ON
    state = transcriptReducer(state, { type: 'TOGGLE_SYSTEM_ENTRIES' });

    expect(state.showSystemEntries).toBe(true);
    expect(state.seenFilteredCount).toBe(5); // All entries now visible
    // Should still be on the same message (uuid '3')
    expect(state.selectedUuid).toBe('3');
    // Index 2 now points to assistant (uuid '3') in full list
    expect(state.selectedIndex).toBe(2);

    // Toggle back OFF
    state = transcriptReducer(state, { type: 'TOGGLE_SYSTEM_ENTRIES' });

    expect(state.showSystemEntries).toBe(false);
    expect(state.seenFilteredCount).toBe(3); // Back to filtered
    // Should still be on same message (uuid '3')
    expect(state.selectedUuid).toBe('3');
    expect(state.selectedIndex).toBe(1); // Back to index 1 in filtered list
  });

  it('should append entries without changing seen count', () => {
    const initial: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'assistant'),
    ];

    let state = transcriptReducer(initialState, {
      type: 'LOAD_TRANSCRIPT',
      entries: initial,
    });

    const newEntries: ParsedTranscriptEntry[] = [
      createEntry('3', 'user'),
      createEntry('4', 'assistant'),
    ];

    state = transcriptReducer(state, {
      type: 'APPEND_ENTRIES',
      entries: newEntries,
    });

    expect(state.entries).toHaveLength(4);
    expect(state.seenFilteredCount).toBe(2); // Unchanged - new entries hidden
    expect(getNewEntriesCount(state)).toBe(2); // 2 new entries hidden
  });

  it('should navigate down and reveal hidden entries at bottom', () => {
    const entries: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'assistant'),
      createEntry('3', 'user'),
    ];

    let state: TranscriptState = {
      ...initialState,
      entries,
      selectedIndex: 0, // At first entry
      seenFilteredCount: 1, // Only first entry seen
      selectedUuid: '1',
      showSystemEntries: false,
    };

    // Navigate down when at bottom with hidden entries - should reveal and advance
    state = transcriptReducer(state, { type: 'NAVIGATE_DOWN' });
    expect(state.seenFilteredCount).toBe(3); // All entries now visible
    expect(state.selectedIndex).toBe(1); // Moved to next entry
    expect(state.selectedUuid).toBe('2');

    // Navigate down again - normal navigation
    state = transcriptReducer(state, { type: 'NAVIGATE_DOWN' });
    expect(state.selectedIndex).toBe(2); // Moved to last entry
    expect(state.selectedUuid).toBe('3');
  });

  it('should jump to latest and reveal all entries', () => {
    const entries: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'assistant'),
      createEntry('3', 'user'),
    ];

    let state: TranscriptState = {
      ...initialState,
      entries,
      selectedIndex: 0,
      seenFilteredCount: 1, // Only first entry seen
      selectedUuid: '1',
      showSystemEntries: false,
    };

    state = transcriptReducer(state, { type: 'JUMP_TO_LATEST' });

    expect(state.seenFilteredCount).toBe(3); // All revealed
    expect(state.selectedIndex).toBe(2); // At last entry
    expect(state.selectedUuid).toBe('3');
  });

  it('should filter entries correctly with selectors', () => {
    const entries: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'system'),
      createEntry('3', 'assistant'),
      createEntry('4', 'meta'),
      createEntry('5', 'file-history'),
    ];

    let state: TranscriptState = {
      ...initialState,
      entries,
      seenFilteredCount: 5,
      showSystemEntries: false,
    };

    // With system OFF
    let filtered = getFilteredEntries(state);
    expect(filtered).toHaveLength(2); // Only user and assistant

    // With system ON
    state.showSystemEntries = true;
    filtered = getFilteredEntries(state);
    expect(filtered).toHaveLength(5); // All entries
  });

  it('should respect seen count in visible entries', () => {
    const entries: ParsedTranscriptEntry[] = [
      createEntry('1', 'user'),
      createEntry('2', 'assistant'),
      createEntry('3', 'user'),
      createEntry('4', 'assistant'),
    ];

    const state: TranscriptState = {
      ...initialState,
      entries,
      seenFilteredCount: 2, // Only first 2 seen
      showSystemEntries: false,
    };

    const visible = getVisibleEntriesFromState(state);
    expect(visible).toHaveLength(2); // Only 2 visible
    expect(visible[0].uuid).toBe('1');
    expect(visible[1].uuid).toBe('2');

    const newCount = getNewEntriesCount(state);
    expect(newCount).toBe(2); // 2 hidden entries
  });
});
