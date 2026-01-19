/**
 * Simple line-by-line diff algorithm
 * Uses a basic LCS (Longest Common Subsequence) approach
 */
export interface DiffLine {
    type: 'add' | 'remove' | 'context';
    line: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}
/**
 * Compute diff between two strings
 * Returns an array of diff lines with type indicators
 */
export declare function computeDiff(oldText: string, newText: string): DiffLine[];
/**
 * Filter diff to show only changed lines with context
 */
export declare function filterDiffWithContext(diff: DiffLine[], contextLines?: number): DiffLine[];
//# sourceMappingURL=computeDiff.d.ts.map