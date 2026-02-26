'use client';

import { useEffect, useRef } from 'react';
import { pusherClient } from './client';
import { CHANNELS } from './events';
import type { Channel } from 'pusher-js';

/**
 * Subscribe to a team's private Pusher channel.
 * Returns nothing — bind to events via the `events` parameter.
 *
 * Usage:
 * ```
 * useTeamChannel(teamId, {
 *   'stage-changed': (data) => { ... },
 *   'note-added': (data) => { ... },
 * });
 * ```
 */
export function useTeamChannel(
  teamId: number | null | undefined,
  events: Record<string, (data: any) => void>
) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!teamId) return;

    const channelName = CHANNELS.team(teamId);
    const channel: Channel = pusherClient.subscribe(channelName);

    const boundEvents = Object.keys(eventsRef.current);

    for (const event of boundEvents) {
      channel.bind(event, (data: any) => {
        eventsRef.current[event]?.(data);
      });
    }

    return () => {
      for (const event of boundEvents) {
        channel.unbind(event);
      }
      pusherClient.unsubscribe(channelName);
    };
  }, [teamId]);
}
