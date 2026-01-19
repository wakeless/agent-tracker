import React from 'react';
export interface DiffViewerProps {
    oldText: string;
    newText: string;
    oldLabel?: string;
    newLabel?: string;
    contextLines?: number;
    showAllLines?: boolean;
}
/**
 * Unified diff display component with colored additions/removals
 */
export declare function DiffViewer({ oldText, newText, oldLabel, newLabel, contextLines, showAllLines, }: DiffViewerProps): React.JSX.Element;
//# sourceMappingURL=DiffViewer.d.ts.map