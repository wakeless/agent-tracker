// Re-export all services from this package
export { ActivityStore, activityReducer } from './ActivityStore.js';
export type { ActivityState, ActivityStoreConfig } from './ActivityStore.js';

export { EventWatcher } from './EventWatcher.js';
export type { EventWatcherOptions } from './EventWatcher.js';

export { ExploreTrackerService } from './ExploreTrackerService.js';
export type { ExploreTrackerOptions, SessionCounts } from './ExploreTrackerService.js';

export { ProjectScanner } from './ProjectScanner.js';
export type { ProjectScannerOptions, SessionIndexEntry } from './ProjectScanner.js';

export { SessionTrackerService } from './SessionTrackerService.js';
export type { SessionTrackerOptions } from './SessionTrackerService.js';
// Note: SessionCounts is exported from ExploreTrackerService (interfaces are identical)

export { TranscriptReader } from './TranscriptReader.js';

export { TranscriptWatcher } from './TranscriptWatcher.js';
export type { TranscriptWatcherOptions } from './TranscriptWatcher.js';

export { PlanReader } from './PlanReader.js';
export type { PlanFile, PlanReaderOptions } from './PlanReader.js';

export { TaskReader } from './TaskReader.js';
export type { TaskReaderOptions } from './TaskReader.js';
