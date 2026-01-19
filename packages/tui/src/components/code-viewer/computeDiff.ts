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
 * Compute the longest common subsequence of two arrays
 */
function lcs<T>(a: T[], b: T[], equals: (x: T, y: T) => boolean): T[] {
  const m = a.length;
  const n = b.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (equals(a[i - 1], b[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const result: T[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (equals(a[i - 1], b[j - 1])) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/**
 * Compute diff between two strings
 * Returns an array of diff lines with type indicators
 */
export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Find common lines using LCS
  const common = lcs(oldLines, newLines, (a, b) => a === b);

  const result: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  let commonIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (commonIdx < common.length) {
      const commonLine = common[commonIdx];

      // Add all removed lines before next common
      while (oldIdx < oldLines.length && oldLines[oldIdx] !== commonLine) {
        result.push({
          type: 'remove',
          line: oldLines[oldIdx],
          oldLineNumber: oldLineNum,
        });
        oldIdx++;
        oldLineNum++;
      }

      // Add all added lines before next common
      while (newIdx < newLines.length && newLines[newIdx] !== commonLine) {
        result.push({
          type: 'add',
          line: newLines[newIdx],
          newLineNumber: newLineNum,
        });
        newIdx++;
        newLineNum++;
      }

      // Add common line as context
      if (oldIdx < oldLines.length && newIdx < newLines.length) {
        result.push({
          type: 'context',
          line: oldLines[oldIdx],
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
        });
        oldIdx++;
        newIdx++;
        oldLineNum++;
        newLineNum++;
        commonIdx++;
      }
    } else {
      // No more common lines - add remaining as removed/added
      while (oldIdx < oldLines.length) {
        result.push({
          type: 'remove',
          line: oldLines[oldIdx],
          oldLineNumber: oldLineNum,
        });
        oldIdx++;
        oldLineNum++;
      }

      while (newIdx < newLines.length) {
        result.push({
          type: 'add',
          line: newLines[newIdx],
          newLineNumber: newLineNum,
        });
        newIdx++;
        newLineNum++;
      }
    }
  }

  return result;
}

/**
 * Filter diff to show only changed lines with context
 */
export function filterDiffWithContext(diff: DiffLine[], contextLines: number = 3): DiffLine[] {
  if (contextLines < 0) {
    return diff;
  }

  // Find indices of changed lines
  const changedIndices: Set<number> = new Set();
  diff.forEach((line, idx) => {
    if (line.type !== 'context') {
      changedIndices.add(idx);
    }
  });

  // Expand to include context
  const visibleIndices: Set<number> = new Set();
  changedIndices.forEach((idx) => {
    for (let i = Math.max(0, idx - contextLines); i <= Math.min(diff.length - 1, idx + contextLines); i++) {
      visibleIndices.add(i);
    }
  });

  // Build filtered result with separators
  const result: DiffLine[] = [];
  let lastIdx = -1;

  const sortedIndices = Array.from(visibleIndices).sort((a, b) => a - b);

  for (const idx of sortedIndices) {
    // Add separator if there's a gap
    if (lastIdx >= 0 && idx > lastIdx + 1) {
      result.push({ type: 'context', line: '...' });
    }
    result.push(diff[idx]);
    lastIdx = idx;
  }

  return result;
}
