import React from 'react';
import { BashInput } from './tools/ToolDisplayProps.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';
export interface BashDetailViewProps {
    bashInput: BashInput;
    toolResult: ParsedTranscriptEntry | null;
}
/**
 * Detail view for Bash tool showing command and full output
 */
export declare function BashDetailView({ bashInput, toolResult }: BashDetailViewProps): React.JSX.Element;
//# sourceMappingURL=BashDetailView.d.ts.map