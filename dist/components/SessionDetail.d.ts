import React from 'react';
import { Session } from '../types/session.js';
import { ParsedTranscriptEntry } from '../types/transcript.js';
interface SessionDetailProps {
    session: Session | null;
    recentTranscript?: ParsedTranscriptEntry[];
}
export declare function SessionDetail({ session, recentTranscript }: SessionDetailProps): React.JSX.Element;
export {};
//# sourceMappingURL=SessionDetail.d.ts.map