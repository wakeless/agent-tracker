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

  // Work tracking
  workSummary?: string;

  // Phantom session detection
  isPhantom?: boolean;           // True if this is a phantom session
  phantomOf?: string;            // Session ID this is a phantom of
  transcriptBirthtime?: Date;    // Transcript file creation time
  transcriptModifiedTime?: Date; // Transcript file last modified time
}

export interface SessionSnapshot {
  sessions: Session[];
  timestamp: Date;
}
