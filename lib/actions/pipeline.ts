'use server';

import { db } from '@/lib/db/drizzle';
import { applications, candidates, jobs } from '@/lib/db/schema';
import { getUser, getTeamId } from '@/lib/db/queries';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { triggerTeamEvent } from '@/lib/pusher/trigger';
import { EVENTS } from '@/lib/pusher/events';

const VALID_STAGES = [
  'applied',
  'screening',
  'interview',
  'assessment',
  'offer',
  'hired',
] as const;

type Stage = (typeof VALID_STAGES)[number];

type PipelineApplication = {
  id: number;
  stage: string;
  stageMovedAt: Date;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    currentTitle: string | null;
    location: string | null;
    source: string;
    email: string;
  };
  job: {
    id: number;
    title: string;
  };
};

export type PipelineData = Record<Stage, PipelineApplication[]>;

async function authenticateAndGetTeam() {
  const user = await getUser();
  if (!user) {
    throw new Error('Niet ingelogd');
  }

  const team = await getTeamId();
  if (!team) {
    throw new Error('Geen team gevonden');
  }

  return { user, team };
}

export async function getPipelineData(
  jobId?: number
): Promise<PipelineData> {
  const { team } = await authenticateAndGetTeam();

  const conditions = [eq(applications.teamId, team.id)];
  if (jobId) {
    conditions.push(eq(applications.jobId, jobId));
  }

  const rows = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      stageMovedAt: applications.stageMovedAt,
      candidateId: candidates.id,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
      currentTitle: candidates.currentTitle,
      location: candidates.location,
      source: candidates.source,
      email: candidates.email,
      jobId: jobs.id,
      jobTitle: jobs.title,
    })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(and(...conditions))
    .orderBy(desc(applications.stageMovedAt));

  const pipeline: PipelineData = {
    applied: [],
    screening: [],
    interview: [],
    assessment: [],
    offer: [],
    hired: [],
  };

  for (const row of rows) {
    const stage = row.stage as Stage;
    if (!VALID_STAGES.includes(stage)) continue;

    pipeline[stage].push({
      id: row.id,
      stage: row.stage,
      stageMovedAt: row.stageMovedAt,
      candidate: {
        id: row.candidateId,
        firstName: row.firstName,
        lastName: row.lastName,
        currentTitle: row.currentTitle,
        location: row.location,
        source: row.source,
        email: row.email,
      },
      job: {
        id: row.jobId,
        title: row.jobTitle,
      },
    });
  }

  return pipeline;
}

export async function moveCandidate(
  applicationId: number,
  newStage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { team } = await authenticateAndGetTeam();

    if (!VALID_STAGES.includes(newStage as Stage)) {
      return { success: false, error: 'Ongeldige fase' };
    }

    const existing = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.teamId, team.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Sollicitatie niet gevonden' };
    }

    const oldStage = existing[0].stage;

    await db
      .update(applications)
      .set({
        stage: newStage,
        stageMovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.teamId, team.id)
        )
      );

    // Trigger real-time event
    await triggerTeamEvent(team.id, EVENTS.STAGE_CHANGED, {
      applicationId,
      candidateId: existing[0].candidateId,
      jobId: existing[0].jobId,
      oldStage,
      newStage,
    });

    revalidatePath('/dashboard/pipeline');
    return { success: true };
  } catch {
    return { success: false, error: 'Er ging iets mis' };
  }
}

export async function getJobsForFilter(): Promise<
  { id: number; title: string }[]
> {
  const { team } = await authenticateAndGetTeam();

  const jobsList = await db
    .select({
      id: jobs.id,
      title: jobs.title,
    })
    .from(jobs)
    .where(eq(jobs.teamId, team.id))
    .orderBy(desc(jobs.createdAt));

  return jobsList;
}

// Combined: fetches pipeline data + job filter options in one call
export async function getPipelinePageData(jobId?: number) {
  const { team } = await authenticateAndGetTeam();

  const conditions = [eq(applications.teamId, team.id)];
  if (jobId) {
    conditions.push(eq(applications.jobId, jobId));
  }

  const [rows, jobsList] = await Promise.all([
    db
      .select({
        id: applications.id,
        stage: applications.stage,
        stageMovedAt: applications.stageMovedAt,
        candidateId: candidates.id,
        firstName: candidates.firstName,
        lastName: candidates.lastName,
        currentTitle: candidates.currentTitle,
        location: candidates.location,
        source: candidates.source,
        email: candidates.email,
        jobId: jobs.id,
        jobTitle: jobs.title,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(...conditions))
      .orderBy(desc(applications.stageMovedAt)),
    db
      .select({ id: jobs.id, title: jobs.title })
      .from(jobs)
      .where(eq(jobs.teamId, team.id))
      .orderBy(desc(jobs.createdAt)),
  ]);

  const pipeline: PipelineData = {
    applied: [],
    screening: [],
    interview: [],
    assessment: [],
    offer: [],
    hired: [],
  };

  for (const row of rows) {
    const stage = row.stage as Stage;
    if (!VALID_STAGES.includes(stage)) continue;

    pipeline[stage].push({
      id: row.id,
      stage: row.stage,
      stageMovedAt: row.stageMovedAt,
      candidate: {
        id: row.candidateId,
        firstName: row.firstName,
        lastName: row.lastName,
        currentTitle: row.currentTitle,
        location: row.location,
        source: row.source,
        email: row.email,
      },
      job: {
        id: row.jobId,
        title: row.jobTitle,
      },
    });
  }

  return { pipeline, jobs: jobsList };
}
