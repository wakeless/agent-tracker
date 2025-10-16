import { TerminalInfo } from './events.js';

export type SessionStatus = 'active' | 'inactive' | 'ended';

export interface Session {
  // Core session data
  id: string;
  cwd: string;
  transcriptPath: string;
  terminal: TerminalInfo;

  // Lifecycle tracking
  status: SessionStatus;
  startTime: Date;
  lastActivityTime: Date;
  endTime?: Date;

  // Display metadata
  displayName?: string;
}

export interface SessionSnapshot {
  sessions: Session[];
  timestamp: Date;
}
