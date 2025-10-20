import { ParsedTranscriptEntry } from '../types/transcript.js';
export interface TranscriptState {
    entries: ParsedTranscriptEntry[];
    seenFilteredCount: number;
    showSystemEntries: boolean;
    selectedUuid: string | null;
}
export type TranscriptAction = {
    type: 'LOAD_TRANSCRIPT';
    entries: ParsedTranscriptEntry[];
    initialSelectedUuid?: string;
} | {
    type: 'APPEND_ENTRIES';
    entries: ParsedTranscriptEntry[];
} | {
    type: 'TOGGLE_SYSTEM_ENTRIES';
} | {
    type: 'NAVIGATE_UP';
} | {
    type: 'NAVIGATE_DOWN';
} | {
    type: 'JUMP_TO_LATEST';
} | {
    type: 'SET_LOADING';
    loading: boolean;
} | {
    type: 'SET_ERROR';
    error: string | null;
};
export declare const initialState: TranscriptState;
export declare function transcriptReducer(state: TranscriptState, action: TranscriptAction): TranscriptState;
/**
 * Selector: Get filtered entries
 */
export declare function getFilteredEntries(state: TranscriptState): ParsedTranscriptEntry[];
/**
 * Selector: Get visible entries (respecting seen count)
 */
export declare function getVisibleEntriesFromState(state: TranscriptState): ParsedTranscriptEntry[];
/**
 * Selector: Get new entries count
 */
export declare function getNewEntriesCount(state: TranscriptState): number;
//# sourceMappingURL=transcriptReducer.d.ts.map