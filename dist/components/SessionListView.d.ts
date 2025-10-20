import React from 'react';
import { Session } from '../types/session.js';
import { SessionTrackerService } from '../services/SessionTrackerService.js';
interface SessionListViewProps {
    sessions: Session[];
    selectedSessionId: string | null;
    service: SessionTrackerService;
    onSelectSession: (sessionId: string | null) => void;
    onViewTranscript: (sessionId: string) => void;
}
export declare function SessionListView({ sessions, selectedSessionId, service, onSelectSession, onViewTranscript, }: SessionListViewProps): React.JSX.Element;
export {};
//# sourceMappingURL=SessionListView.d.ts.map