'use server';

import { getUser, getTeamId } from '@/lib/db/queries';

export async function getTeamIdForClient(): Promise<number | null> {
  const team = await getTeamId();
  return team?.id ?? null;
}

export async function getCurrentUserId(): Promise<number | null> {
  const user = await getUser();
  return user?.id ?? null;
}
