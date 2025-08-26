// apps/api/src/inngest/events.ts
// Event definitions for the job system

export const EVT = {
  // Job lifecycle events
  KeywordRequested: "keyword/requested",
  JobStarted: "job/started",
  JobRunning: "job/running",
  JobCompleted: "job/completed",
  JobFailed: "job/failed",
  
  // Apify integration events
  ApifyRunStarted: "apify/run.started",
  ApifyRunCompleted: "apify/run.completed",
  ApifyRunFailed: "apify/run.failed",
  
  // Legacy events (kept for backward compatibility)
  DowngradeCanceled: "downgrade/canceled",
  DowngradeCanceledOrgs: "downgrade/canceled-orgs",
} as const;

// Event payload types for type safety
export interface KeywordRequestedEvent {
  name: typeof EVT.KeywordRequested;
  data: {
    orgId: string;
    keyword: string;
    input?: Record<string, any>;
    jobId: string;
  };
}

export interface JobStartedEvent {
  name: typeof EVT.JobStarted;
  data: {
    jobId: string;
    orgId: string;
    keyword: string;
  };
}

export interface JobRunningEvent {
  name: typeof EVT.JobRunning;
  data: {
    jobId: string;
    apifyRunId: string;
  };
}

export interface JobCompletedEvent {
  name: typeof EVT.JobCompleted;
  data: {
    jobId: string;
    orgId: string;
    analysis: any;
  };
}

export interface JobFailedEvent {
  name: typeof EVT.JobFailed;
  data: {
    jobId: string;
    orgId: string;
    error: string;
  };
}

export interface ApifyRunStartedEvent {
  name: typeof EVT.ApifyRunStarted;
  data: {
    jobId: string;
    runId: string;
    orgId: string;
  };
}

export interface ApifyRunCompletedEvent {
  name: typeof EVT.ApifyRunCompleted;
  data: {
    jobId: string;
    runId: string;
    orgId: string;
    datasetItems: any[];
  };
}

export interface ApifyRunFailedEvent {
  name: typeof EVT.ApifyRunFailed;
  data: {
    jobId: string;
    runId: string;
    orgId: string;
    error: string;
  };
}

// Union type for all job-related events
export type JobEvent = 
  | KeywordRequestedEvent
  | JobStartedEvent
  | JobRunningEvent
  | JobCompletedEvent
  | JobFailedEvent
  | ApifyRunStartedEvent
  | ApifyRunCompletedEvent
  | ApifyRunFailedEvent; 