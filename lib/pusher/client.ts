import PusherClient from 'pusher-js';

const globalForPusher = globalThis as unknown as { pusherClient?: PusherClient };

export const pusherClient =
  globalForPusher.pusherClient ??
  new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    channelAuthorization: {
      endpoint: '/api/pusher/auth',
      transport: 'ajax',
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPusher.pusherClient = pusherClient;
}
