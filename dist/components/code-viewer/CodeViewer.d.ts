import React from 'react';
export interface CodeViewerProps {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
    startLine?: number;
    highlightLines?: number[];
    maxHeight?: number;
}
/**
 * Enhanced code display component with line numbers and borders
 */
export declare function CodeViewer({ code, language, showLineNumbers, startLine, highlightLines, maxHeight, }: CodeViewerProps): React.JSX.Element;
//# sourceMappingURL=CodeViewer.d.ts.map