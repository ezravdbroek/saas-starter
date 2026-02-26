'use server';

import { db } from '@/lib/db/drizzle';
import {
  jobs,
  candidates,
  applications,
  interviews,
  users,
} from '@/lib/db/schema';
import { getTeamId } from '@/lib/db/queries';
import { eq, and, count, gte, lte, asc } from 'drizzle-orm';

export async function getDashboardData() {
  const team = await getTeamId();
  if (!team) {
    return {
      stats: {
        activeJobs: 0,
        totalCandidates: 0,
        interviewsThisWeek: 0,
        inOfferStage: 0,
      },
      upcomingInterviews: [],
    };
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Run ALL queries in parallel — single auth, single round of DB calls
  const [
    activeJobsResult,
    totalCandidatesResult,
    interviewsResult,
    offerResult,
    upcomingResult,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(jobs)
      .where(and(eq(jobs.teamId, team.id), eq(jobs.status, 'published'))),
    db
      .select({ value: count() })
      .from(candidates)
      .where(eq(candidates.teamId, team.id)),
    db
      .select({ value: count() })
      .from(interviews)
      .where(
        and(
          eq(interviews.teamId, team.id),
          eq(interviews.status, 'scheduled'),
          gte(interviews.scheduledAt, startOfWeek),
          lte(interviews.scheduledAt, endOfWeek)
        )
      ),
    db
      .select({ value: count() })
      .from(applications)
      .where(
        and(eq(applications.teamId, team.id), eq(applications.stage, 'offer'))
      ),
    db
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
      .limit(5),
  ]);

  return {
    stats: {
      activeJobs: activeJobsResult[0].value,
      totalCandidates: totalCandidatesResult[0].value,
      interviewsThisWeek: interviewsResult[0].value,
      inOfferStage: offerResult[0].value,
    },
    upcomingInterviews: upcomingResult,
  };
}
