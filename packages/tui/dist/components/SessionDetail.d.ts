import React from 'react';
import { Session } from '@agent-tracker/core';
import { ParsedTranscriptEntry } from '@agent-tracker/core';
interface SessionDetailProps {
    session: Session | null;
    recentTranscript?: ParsedTranscriptEntry[];
}
export declare function SessionDetail({ session, recentTranscript }: SessionDetailProps): React.JSX.Element;
export {};
//# sourceMappingURL=SessionDetail.d.ts.map