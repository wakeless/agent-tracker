import React from 'react';
import { GrepInput } from './tools/ToolDisplayProps.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';
export interface GrepDetailViewProps {
    grepInput: GrepInput;
    toolResult: ParsedTranscriptEntry | null;
}
/**
 * Detail view for Grep tool showing pattern and full search results
 */
export declare function GrepDetailView({ grepInput, toolResult }: GrepDetailViewProps): React.JSX.Element;
//# sourceMappingURL=GrepDetailView.d.ts.map