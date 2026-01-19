import { TerminalInfo, GitInfo } from './events.js';
export type SessionStatus = 'active' | 'inactive' | 'ended';
export interface Session {
    id: string;
    cwd: string;
    transcriptPath: string;
    terminal: TerminalInfo;
    git: GitInfo;
    status: SessionStatus;
    startTime: Date;
    lastActivityTime: Date;
    endTime?: Date;
    awaitingInput: boolean;
    notificationMessage?: string;
    displayName?: string;
    workSummary?: string;
    isPhantom?: boolean;
    phantomOf?: string;
    transcriptBirthtime?: Date;
    transcriptModifiedTime?: Date;
}
export interface SessionSnapshot {
    sessions: Session[];
    timestamp: Date;
}
//# sourceMappingURL=session.d.ts.map