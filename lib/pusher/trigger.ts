import { CHANNELS } from './events';

/**
 * Safely trigger a Pusher event for a team.
 * Does nothing if Pusher is not configured (missing env vars).
 */
export async function triggerTeamEvent(
  teamId: number,
  event: string,
  data: Record<string, unknown>
) {
  // Skip if Pusher is not configured
  if (!process.env.PUSHER_APP_ID || !process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.PUSHER_SECRET) {
    return;
  }

  try {
    const { pusherServer } = await import('./server');
    await pusherServer.trigger(CHANNELS.team(teamId), event, data);
  } catch (err) {
    // Log but don't throw — Pusher failures shouldn't break the app
    console.error('[Pusher] Failed to trigger event:', err);
  }
}
