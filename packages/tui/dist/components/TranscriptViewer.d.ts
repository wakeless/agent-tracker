import React from 'react';
import { ParsedTranscriptEntry, Session } from '@agent-tracker/core';
import { EditInput, WriteInput, BashInput, GrepInput } from './tools/ToolDisplayProps.js';
interface TranscriptViewerProps {
    transcriptPath: string;
    sessionId: string;
    session: Session;
    onShowToolDetail?: (toolEntry: ParsedTranscriptEntry, allEntries: ParsedTranscriptEntry[]) => void;
    onShowPlanDetail?: (planEntryUuid: string, plan: string, allowedPrompts?: Array<{
        tool: string;
        prompt: string;
    }>) => void;
    onShowEditDetail?: (editEntryUuid: string, editInput: EditInput) => void;
    onShowWriteDetail?: (writeEntryUuid: string, writeInput: WriteInput) => void;
    onShowBashDetail?: (bashEntryUuid: string, bashInput: BashInput, toolResult: ParsedTranscriptEntry | null) => void;
    onShowGrepDetail?: (grepEntryUuid: string, grepInput: GrepInput, toolResult: ParsedTranscriptEntry | null) => void;
    initialSelectedUuid?: string;
    onSelectionChange?: (selectedUuid: string) => void;
}
export declare function TranscriptViewer({ transcriptPath, sessionId, session, onShowToolDetail, onShowPlanDetail, onShowEditDetail, onShowWriteDetail, onShowBashDetail, onShowGrepDetail, initialSelectedUuid, onSelectionChange }: TranscriptViewerProps): React.JSX.Element;
export {};
//# sourceMappingURL=TranscriptViewer.d.ts.map