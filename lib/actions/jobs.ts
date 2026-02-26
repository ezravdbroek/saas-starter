'use server';

import { db } from '@/lib/db/drizzle';
import { jobs, applications, candidates } from '@/lib/db/schema';
import { getUser, getTeamId } from '@/lib/db/queries';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { triggerTeamEvent } from '@/lib/pusher/trigger';
import { EVENTS } from '@/lib/pusher/events';

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

export async function getJobs() {
  const { team } = await authenticateAndGetTeam();

  const jobsList = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      department: jobs.department,
      location: jobs.location,
      locationType: jobs.locationType,
      employmentType: jobs.employmentType,
      experienceLevel: jobs.experienceLevel,
      status: jobs.status,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
      applicationCount: count(applications.id),
    })
    .from(jobs)
    .leftJoin(applications, eq(jobs.id, applications.jobId))
    .where(eq(jobs.teamId, team.id))
    .groupBy(jobs.id)
    .orderBy(desc(jobs.createdAt));

  return jobsList;
}

export async function getJobById(jobId: number) {
  const { team } = await authenticateAndGetTeam();

  const job = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)))
    .limit(1);

  if (job.length === 0) {
    return null;
  }

  return job[0];
}

export async function getApplicationsForJob(jobId: number) {
  const { team } = await authenticateAndGetTeam();

  const result = await db
    .select({
      id: applications.id,
      stage: applications.stage,
      createdAt: applications.createdAt,
      candidateId: candidates.id,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
      email: candidates.email,
      currentTitle: candidates.currentTitle,
    })
    .from(applications)
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .where(
      and(eq(applications.jobId, jobId), eq(applications.teamId, team.id))
    )
    .orderBy(desc(applications.createdAt));

  return result;
}

export type CreateJobData = {
  title: string;
  department?: string;
  location?: string;
  locationType: string;
  employmentType: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  status: string;
};

export async function createJob(data: CreateJobData) {
  const { user, team } = await authenticateAndGetTeam();

  const result = await db.insert(jobs).values({
    teamId: team.id,
    title: data.title,
    department: data.department || null,
    location: data.location || null,
    locationType: data.locationType,
    employmentType: data.employmentType,
    experienceLevel: data.experienceLevel || null,
    salaryMin: data.salaryMin || null,
    salaryMax: data.salaryMax || null,
    salaryCurrency: data.salaryCurrency || 'EUR',
    description: data.description || null,
    requirements: data.requirements || null,
    responsibilities: data.responsibilities || null,
    status: data.status,
    hiringManagerId: user.id,
  }).returning({ id: jobs.id });

  await triggerTeamEvent(team.id, EVENTS.JOB_CREATED, {
    jobId: result[0].id,
    title: data.title,
  });

  revalidatePath('/dashboard/jobs');
  redirect('/dashboard/jobs');
}

export async function updateJob(
  jobId: number,
  data: Partial<CreateJobData>
) {
  const { team } = await authenticateAndGetTeam();

  const existing = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error('Vacature niet gevonden');
  }

  await db
    .update(jobs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)));

  await triggerTeamEvent(team.id, EVENTS.JOB_UPDATED, { jobId });

  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function updateJobStatus(jobId: number, status: string) {
  const { team } = await authenticateAndGetTeam();

  const existing = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error('Vacature niet gevonden');
  }

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'closed') {
    updateData.closedAt = new Date();
  }

  await db
    .update(jobs)
    .set(updateData)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)));

  await triggerTeamEvent(team.id, EVENTS.JOB_UPDATED, { jobId });

  revalidatePath('/dashboard/jobs');
  revalidatePath(`/dashboard/jobs/${jobId}`);
}

export async function deleteJob(jobId: number) {
  const { team } = await authenticateAndGetTeam();

  const existing = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)))
    .limit(1);

  if (existing.length === 0) {
    throw new Error('Vacature niet gevonden');
  }

  await db
    .delete(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)));

  await triggerTeamEvent(team.id, EVENTS.JOB_DELETED, { jobId });

  revalidatePath('/dashboard/jobs');
  redirect('/dashboard/jobs');
}
