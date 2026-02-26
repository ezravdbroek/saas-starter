'use server';

import { db } from '@/lib/db/drizzle';
import {
  interviews,
  applications,
  candidates,
  jobs,
  users,
} from '@/lib/db/schema';
import { getUser, getTeamId } from '@/lib/db/queries';
import { eq, and, desc, gte, lte, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getInterviews() {
  const team = await getTeamId();
  if (!team) return [];

  const result = await db
    .select({
      id: interviews.id,
      scheduledAt: interviews.scheduledAt,
      duration: interviews.duration,
      type: interviews.type,
      status: interviews.status,
      feedback: interviews.feedback,
      rating: interviews.rating,
      candidateFirstName: candidates.firstName,
      candidateLastName: candidates.lastName,
      candidateId: candidates.id,
      jobTitle: jobs.title,
      jobId: jobs.id,
      interviewerName: users.name,
      interviewerEmail: users.email,
      interviewerId: users.id,
    })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(interviews.interviewerId, users.id))
    .where(eq(interviews.teamId, team.id))
    .orderBy(asc(interviews.scheduledAt));

  return result;
}

export async function getUpcomingInterviews(limit = 5) {
  const team = await getTeamId();
  if (!team) return [];

  const now = new Date();

  const result = await db
    .select({
      id: interviews.id,
      scheduledAt: interviews.scheduledAt,
      duration: interviews.duration,
      type: interviews.type,
      status: interviews.status,
      candidateFirstName: candidates.firstName,
      candidateLastName: candidates.lastName,
      candidateId: candidates.id,
      jobTitle: jobs.title,
      interviewerName: users.name,
    })
    .from(interviews)
    .innerJoin(applications, eq(interviews.applicationId, applications.id))
    .innerJoin(candidates, eq(applications.candidateId, candidates.id))
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(interviews.interviewerId, users.id))
    .where(
      and(
        eq(interviews.teamId, team.id),
        eq(interviews.status, 'scheduled'),
        gte(interviews.scheduledAt, now)
      )
    )
    .orderBy(asc(interviews.scheduledAt))
    .limit(limit);

  return result;
}

export async function createInterview(data: {
  applicationId: number;
  interviewerId: number;
  scheduledAt: string;
  duration: number;
  type: string;
}) {
  const user = await getUser();
  if (!user) throw new Error('Niet ingelogd');

  const team = await getTeamId();
  if (!team) throw new Error('Geen team gevonden');

  const application = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.id, data.applicationId),
        eq(applications.teamId, team.id)
      )
    )
    .limit(1);

  if (application.length === 0) throw new Error('Sollicitatie niet gevonden');

  await db.insert(interviews).values({
    applicationId: data.applicationId,
    teamId: team.id,
    interviewerId: data.interviewerId,
    scheduledAt: new Date(data.scheduledAt),
    duration: data.duration,
    type: data.type,
    status: 'scheduled',
  });

  revalidatePath('/dashboard/interviews');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateInterviewStatus(
  interviewId: number,
  status: string,
  feedback?: string,
  rating?: number
) {
  const user = await getUser();
  if (!user) throw new Error('Niet ingelogd');

  const team = await getTeamId();
  if (!team) throw new Error('Geen team gevonden');

  await db
    .update(interviews)
    .set({
      status,
      feedback: feedback ?? undefined,
      rating: rating ?? undefined,
      updatedAt: new Date(),
    })
    .where(
      and(eq(interviews.id, interviewId), eq(interviews.teamId, team.id))
    );

  revalidatePath('/dashboard/interviews');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function cancelInterview(interviewId: number) {
  return updateInterviewStatus(interviewId, 'cancelled');
}
