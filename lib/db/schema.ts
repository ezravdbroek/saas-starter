import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// ATS Tables

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  title: varchar('title', { length: 200 }).notNull(),
  department: varchar('department', { length: 100 }),
  location: varchar('location', { length: 200 }),
  locationType: varchar('location_type', { length: 20 }).notNull().default('onsite'),
  employmentType: varchar('employment_type', { length: 20 }).notNull().default('fulltime'),
  experienceLevel: varchar('experience_level', { length: 20 }),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  salaryCurrency: varchar('salary_currency', { length: 3 }).default('EUR'),
  description: text('description'),
  requirements: text('requirements'),
  responsibilities: text('responsibilities'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  hiringManagerId: integer('hiring_manager_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  currentTitle: varchar('current_title', { length: 200 }),
  currentCompany: varchar('current_company', { length: 200 }),
  location: varchar('location', { length: 200 }),
  linkedinUrl: varchar('linkedin_url', { length: 500 }),
  portfolioUrl: varchar('portfolio_url', { length: 500 }),
  source: varchar('source', { length: 50 }).notNull().default('manual'),
  referredBy: integer('referred_by').references(() => users.id),
  resumeUrl: varchar('resume_url', { length: 500 }),
  coverLetterUrl: varchar('cover_letter_url', { length: 500 }),
  notes: text('notes'),
  tags: text('tags').default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id')
    .notNull()
    .references(() => candidates.id),
  jobId: integer('job_id')
    .notNull()
    .references(() => jobs.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  stage: varchar('stage', { length: 20 }).notNull().default('applied'),
  stageMovedAt: timestamp('stage_moved_at').notNull().defaultNow(),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const candidateNotes = pgTable('candidate_notes', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id')
    .notNull()
    .references(() => candidates.id),
  applicationId: integer('application_id').references(() => applications.id),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  parentId: integer('parent_id'),
  content: text('content').notNull(),
  type: varchar('type', { length: 30 }).notNull().default('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const noteReactions = pgTable('note_reactions', {
  id: serial('id').primaryKey(),
  noteId: integer('note_id')
    .notNull()
    .references(() => candidateNotes.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const interviews = pgTable('interviews', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .notNull()
    .references(() => applications.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  interviewerId: integer('interviewer_id')
    .notNull()
    .references(() => users.id),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').notNull().default(60),
  type: varchar('type', { length: 30 }).notNull().default('video'),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  feedback: text('feedback'),
  rating: integer('rating'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  jobs: many(jobs),
  candidates: many(candidates),
  applications: many(applications),
  interviews: many(interviews),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  team: one(teams, {
    fields: [jobs.teamId],
    references: [teams.id],
  }),
  hiringManager: one(users, {
    fields: [jobs.hiringManagerId],
    references: [users.id],
  }),
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  team: one(teams, {
    fields: [candidates.teamId],
    references: [teams.id],
  }),
  referrer: one(users, {
    fields: [candidates.referredBy],
    references: [users.id],
  }),
  applications: many(applications),
  notes: many(candidateNotes),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  team: one(teams, {
    fields: [applications.teamId],
    references: [teams.id],
  }),
  interviews: many(interviews),
  notes: many(candidateNotes),
}));

export const candidateNotesRelations = relations(candidateNotes, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [candidateNotes.candidateId],
    references: [candidates.id],
  }),
  application: one(applications, {
    fields: [candidateNotes.applicationId],
    references: [applications.id],
  }),
  author: one(users, {
    fields: [candidateNotes.authorId],
    references: [users.id],
  }),
  reactions: many(noteReactions),
}));

export const noteReactionsRelations = relations(noteReactions, ({ one }) => ({
  note: one(candidateNotes, {
    fields: [noteReactions.noteId],
    references: [candidateNotes.id],
  }),
  user: one(users, {
    fields: [noteReactions.userId],
    references: [users.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
  team: one(teams, {
    fields: [interviews.teamId],
    references: [teams.id],
  }),
  interviewer: one(users, {
    fields: [interviews.interviewerId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type CandidateNote = typeof candidateNotes.$inferSelect;
export type NewCandidateNote = typeof candidateNotes.$inferInsert;
export type NoteReaction = typeof noteReactions.$inferSelect;
export type NewNoteReaction = typeof noteReactions.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
