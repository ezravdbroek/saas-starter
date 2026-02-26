'use server';

import { db } from '@/lib/db/drizzle';
import {
  candidates,
  applications,
  candidateNotes,
  noteReactions,
  jobs,
  users,
} from '@/lib/db/schema';
import { getUser, getTeamId } from '@/lib/db/queries';
import { eq, and, desc, or, ilike, count, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { triggerTeamEvent } from '@/lib/pusher/trigger';
import { EVENTS } from '@/lib/pusher/events';

async function requireTeam() {
  const user = await getUser();
  if (!user) throw new Error('Niet ingelogd');

  const team = await getTeamId();
  if (!team) throw new Error('Geen team gevonden');

  return { user, team };
}

export async function getCandidates() {
  const { team } = await requireTeam();

  const result = await db
    .select({
      id: candidates.id,
      firstName: candidates.firstName,
      lastName: candidates.lastName,
      email: candidates.email,
      phone: candidates.phone,
      currentTitle: candidates.currentTitle,
      currentCompany: candidates.currentCompany,
      location: candidates.location,
      source: candidates.source,
      linkedinUrl: candidates.linkedinUrl,
      portfolioUrl: candidates.portfolioUrl,
      notes: candidates.notes,
      tags: candidates.tags,
      createdAt: candidates.createdAt,
      updatedAt: candidates.updatedAt,
      applicationCount: count(applications.id),
    })
    .from(candidates)
    .leftJoin(applications, eq(candidates.id, applications.candidateId))
    .where(eq(candidates.teamId, team.id))
    .groupBy(candidates.id)
    .orderBy(desc(candidates.createdAt));

  return result;
}

export async function getCandidateById(candidateId: number) {
  const { team } = await requireTeam();

  const candidate = await db
    .select()
    .from(candidates)
    .where(and(eq(candidates.id, candidateId), eq(candidates.teamId, team.id)))
    .limit(1);

  if (candidate.length === 0) return null;

  const candidateData = candidate[0];

  // Fetch applications + notes in parallel
  const [apps, notes, reactions] = await Promise.all([
    db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        stage: applications.stage,
        stageMovedAt: applications.stageMovedAt,
        createdAt: applications.createdAt,
        jobTitle: jobs.title,
        jobDepartment: jobs.department,
        jobLocation: jobs.location,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(
        and(
          eq(applications.candidateId, candidateId),
          eq(applications.teamId, team.id)
        )
      )
      .orderBy(desc(applications.createdAt)),
    db
      .select({
        id: candidateNotes.id,
        content: candidateNotes.content,
        type: candidateNotes.type,
        parentId: candidateNotes.parentId,
        applicationId: candidateNotes.applicationId,
        createdAt: candidateNotes.createdAt,
        authorId: candidateNotes.authorId,
        authorName: users.name,
        authorEmail: users.email,
      })
      .from(candidateNotes)
      .innerJoin(users, eq(candidateNotes.authorId, users.id))
      .where(eq(candidateNotes.candidateId, candidateId))
      .orderBy(desc(candidateNotes.createdAt)),
    db
      .select({
        id: noteReactions.id,
        noteId: noteReactions.noteId,
        userId: noteReactions.userId,
        emoji: noteReactions.emoji,
        userName: users.name,
      })
      .from(noteReactions)
      .innerJoin(users, eq(noteReactions.userId, users.id))
      .innerJoin(candidateNotes, eq(noteReactions.noteId, candidateNotes.id))
      .where(eq(candidateNotes.candidateId, candidateId)),
  ]);

  return {
    ...candidateData,
    applications: apps,
    candidateNotes: notes,
    noteReactions: reactions,
  };
}

export async function createCandidate(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentTitle?: string;
  currentCompany?: string;
  location?: string;
  source?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  notes?: string;
}) {
  const { team } = await requireTeam();

  const result = await db
    .insert(candidates)
    .values({
      teamId: team.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      currentTitle: data.currentTitle || null,
      currentCompany: data.currentCompany || null,
      location: data.location || null,
      source: data.source || 'manual',
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      notes: data.notes || null,
    })
    .returning();

  revalidatePath('/dashboard/candidates');

  // Trigger real-time event
  await triggerTeamEvent(team.id, EVENTS.CANDIDATE_CREATED, {
    candidateId: result[0].id,
    firstName: result[0].firstName,
    lastName: result[0].lastName,
  });

  return result[0];
}

export async function updateCandidate(
  candidateId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    currentTitle?: string;
    currentCompany?: string;
    location?: string;
    source?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    notes?: string;
    tags?: string;
  }
) {
  const { team } = await requireTeam();

  const result = await db
    .update(candidates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(candidates.id, candidateId), eq(candidates.teamId, team.id)))
    .returning();

  revalidatePath('/dashboard/candidates');
  revalidatePath(`/dashboard/candidates/${candidateId}`);

  await triggerTeamEvent(team.id, EVENTS.CANDIDATE_UPDATED, {
    candidateId,
  });

  return result[0];
}

export async function addCandidateToJob(candidateId: number, jobId: number) {
  const { team } = await requireTeam();

  // Verify candidate belongs to team
  const candidate = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(and(eq(candidates.id, candidateId), eq(candidates.teamId, team.id)))
    .limit(1);

  if (candidate.length === 0) throw new Error('Kandidaat niet gevonden');

  // Verify job belongs to team
  const job = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.teamId, team.id)))
    .limit(1);

  if (job.length === 0) throw new Error('Vacature niet gevonden');

  // Check if application already exists
  const existing = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, candidateId),
        eq(applications.jobId, jobId)
      )
    )
    .limit(1);

  if (existing.length > 0) throw new Error('Kandidaat is al gekoppeld aan deze vacature');

  const result = await db
    .insert(applications)
    .values({
      candidateId,
      jobId,
      teamId: team.id,
      stage: 'applied',
    })
    .returning();

  revalidatePath(`/dashboard/candidates/${candidateId}`);
  revalidatePath('/dashboard/pipeline');

  await triggerTeamEvent(team.id, EVENTS.APPLICATION_CREATED, {
    applicationId: result[0].id,
    candidateId,
    jobId,
  });

  return result[0];
}

export async function addCandidateNote(
  candidateId: number,
  content: string,
  type: string = 'note',
  applicationId?: number,
  parentId?: number
) {
  const { user, team } = await requireTeam();

  // Verify candidate belongs to team
  const candidate = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(and(eq(candidates.id, candidateId), eq(candidates.teamId, team.id)))
    .limit(1);

  if (candidate.length === 0) throw new Error('Kandidaat niet gevonden');

  const result = await db
    .insert(candidateNotes)
    .values({
      candidateId,
      authorId: user.id,
      content,
      type: parentId ? 'reply' : type,
      parentId: parentId || null,
      applicationId: applicationId || null,
    })
    .returning();

  revalidatePath(`/dashboard/candidates/${candidateId}`);

  await triggerTeamEvent(team.id, EVENTS.NOTE_ADDED, {
    noteId: result[0].id,
    candidateId,
    authorName: user.name || user.email,
    content,
    type: parentId ? 'reply' : type,
  });

  return result[0];
}

export async function toggleNoteReaction(
  noteId: number,
  emoji: string
): Promise<{ added: boolean }> {
  const { user, team } = await requireTeam();

  // Verify note belongs to a candidate in this team
  const note = await db
    .select({
      id: candidateNotes.id,
      candidateId: candidateNotes.candidateId,
    })
    .from(candidateNotes)
    .innerJoin(candidates, eq(candidateNotes.candidateId, candidates.id))
    .where(
      and(eq(candidateNotes.id, noteId), eq(candidates.teamId, team.id))
    )
    .limit(1);

  if (note.length === 0) throw new Error('Notitie niet gevonden');

  // Check if reaction already exists
  const existing = await db
    .select({ id: noteReactions.id })
    .from(noteReactions)
    .where(
      and(
        eq(noteReactions.noteId, noteId),
        eq(noteReactions.userId, user.id),
        eq(noteReactions.emoji, emoji)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove reaction
    await db
      .delete(noteReactions)
      .where(eq(noteReactions.id, existing[0].id));

    revalidatePath(`/dashboard/candidates/${note[0].candidateId}`);
    return { added: false };
  }

  // Add reaction
  await db.insert(noteReactions).values({
    noteId,
    userId: user.id,
    emoji,
  });

  revalidatePath(`/dashboard/candidates/${note[0].candidateId}`);

  await triggerTeamEvent(team.id, EVENTS.NOTE_ADDED, {
    noteId,
    candidateId: note[0].candidateId,
    authorName: user.name || user.email,
    content: emoji,
    type: 'reaction',
  });

  return { added: true };
}

export async function getPublishedJobs() {
  const { team } = await requireTeam();

  return await db
    .select({
      id: jobs.id,
      title: jobs.title,
      department: jobs.department,
      location: jobs.location,
    })
    .from(jobs)
    .where(and(eq(jobs.teamId, team.id), eq(jobs.status, 'published')))
    .orderBy(desc(jobs.createdAt));
}
