// Pusher event types for the Hiro ATS
// All events are sent on the channel: `private-team-{teamId}`

export const CHANNELS = {
  team: (teamId: number) => `private-team-${teamId}`,
} as const;

export const EVENTS = {
  // Pipeline
  STAGE_CHANGED: 'stage-changed',
  // Candidates
  CANDIDATE_CREATED: 'candidate-created',
  CANDIDATE_UPDATED: 'candidate-updated',
  // Notes / Timeline
  NOTE_ADDED: 'note-added',
  // Jobs
  JOB_CREATED: 'job-created',
  JOB_UPDATED: 'job-updated',
  JOB_DELETED: 'job-deleted',
  // Applications
  APPLICATION_CREATED: 'application-created',
} as const;

// Event payload types
export type StageChangedEvent = {
  applicationId: number;
  candidateId: number;
  jobId: number;
  oldStage: string;
  newStage: string;
  movedBy: string; // user email/name
};

export type CandidateCreatedEvent = {
  candidateId: number;
  firstName: string;
  lastName: string;
};

export type CandidateUpdatedEvent = {
  candidateId: number;
};

export type NoteAddedEvent = {
  noteId: number;
  candidateId: number;
  authorName: string;
  content: string;
  type: string;
};

export type JobCreatedEvent = {
  jobId: number;
  title: string;
};

export type JobUpdatedEvent = {
  jobId: number;
};

export type JobDeletedEvent = {
  jobId: number;
};

export type ApplicationCreatedEvent = {
  applicationId: number;
  candidateId: number;
  jobId: number;
};
