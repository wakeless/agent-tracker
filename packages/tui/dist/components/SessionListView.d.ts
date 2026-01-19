import React from 'react';
import { Session } from '@agent-tracker/core';
/**
 * Common interface for tracker services used in SessionListView
 */
interface TrackerService {
    getSessionCounts(): {
        total: number;
        active: number;
        inactive: number;
        ended: number;
        awaitingInput: number;
    };
}
interface SessionListViewProps {
    sessions: Session[];
    selectedSessionId: string | null;
    service: TrackerService;
    onSelectSession: (sessionId: string | null) => void;
    onViewTranscript: (sessionId: string) => void;
}
export declare function SessionListView({ sessions, selectedSessionId, service, onSelectSession, onViewTranscript, }: SessionListViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=SessionListView.d.ts.map