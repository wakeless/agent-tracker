// Main entry point for @agent-tracker/core
// Re-exports all public APIs

// Services
export {
  ActivityStore,
  activityReducer,
  ExploreTrackerService,
  ProjectScanner,
  TranscriptReader,
  TranscriptWatcher,
} from './services/index.js';

export type {
  ActivityState,
  ActivityStoreConfig,
  ExploreTrackerOptions,
  SessionCounts,
  ProjectScannerOptions,
  SessionIndexEntry,
  TranscriptWatcherOptions,
} from './services/index.js';

// Types
export {
  actions,
  isSystemMessage,
} from './types/index.js';

export type {
  // Events
  ITermInfo,
  DockerInfo,
  GitInfo,
  TerminalInfo,
  TranscriptFileInfo,
  BaseEvent,
  SessionStartEvent,
  SessionEndEvent,
  ActivityEvent as EventActivityEvent,
  SessionEvent,
  EventHandler,
  // Session
  SessionStatus,
  Session,
  SessionSnapshot,
  // Actions
  ActivityEvent,
  ActionType,
  Action,
  SessionStartAction,
  SessionEndAction,
  ActivityToolUseAction,
  ActivityPromptSubmitAction,
  ActivityStopAction,
  ActivitySubagentStopAction,
  ActivityNotificationAction,
  UpdateSessionStatusesAction,
  UpdateWorkSummaryAction,
  // Transcript
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ThinkingBlock,
  ToolResultBlock,
  TranscriptEntry,
  UserMessage,
  AssistantMessage,
  Usage,
  ParsedTranscriptEntry,
} from './types/index.js';

// Utils
export {
  filterUserConversation,
  getRecentConversation,
  calculateHash,
  generateRgbFromHash,
  calculateTextContrast,
  rgbToHex,
  getStableColor,
  getStableTextColor,
  parseITermSessionId,
} from './utils/index.js';

export type {
  RGB,
  ITermSessionParts,
} from './utils/index.js';
