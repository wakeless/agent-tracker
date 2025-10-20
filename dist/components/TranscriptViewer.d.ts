import React from 'react';
import { ParsedTranscriptEntry } from '../types/transcript.js';
import { Session } from '../types/session.js';
interface TranscriptViewerProps {
    transcriptPath: string;
    sessionId: string;
    session: Session;
    onShowToolDetail?: (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => void;
    initialSelectedUuid?: string;
    onSelectionChange?: (selectedUuid: string) => void;
}
export declare function TranscriptViewer({ transcriptPath, sessionId, session, onShowToolDetail, initialSelectedUuid, onSelectionChange }: TranscriptViewerProps): React.JSX.Element;
export {};
//# sourceMappingURL=TranscriptViewer.d.ts.map