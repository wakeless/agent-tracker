import { TerminalInfo, GitInfo } from './events.js';

export type SessionStatus = 'active' | 'inactive' | 'ended';

export interface Session {
  // Core session data
  id: string;
  cwd: string;
  transcriptPath: string;
  terminal: TerminalInfo;
  git: GitInfo;

  // Lifecycle tracking
  status: SessionStatus;
  startTime: Date;
  lastActivityTime: Date;
  endTime?: Date;

  // User interaction state
  awaitingInput: boolean;
  notificationMessage?: string;

  // Display metadata
  displayName?: string;
}

export interface SessionSnapshot {
  sessions: Session[];
  timestamp: Date;
}
