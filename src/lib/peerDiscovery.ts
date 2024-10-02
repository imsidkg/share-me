import Pusher from 'pusher-js';
import { Channel } from 'pusher-js';

export function createPeerDiscovery(
  onPeerDiscovered: (peerId: string) => void,
  onSignalReceived: (signal: any) => void
) {
  const peerId: string = Math.random().toString(36).substr(2, 9);
  let pusher: Pusher | null = null;
  let channel: Channel | null = null;

  function start(): void {
    if (!pusher) {
      pusher = new Pusher('YOUR_APP_KEY', { cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!});
      channel = pusher.subscribe('peer-discovery');
    }

    channel!.bind('pusher:subscription_succeeded', () => {
      // Announce this peer when successfully subscribed
      channel!.trigger('client-peer-announced', { peerId });
    });

    channel?.bind('client-peer-announced', (data: { peerId: string }) => {
      if (data.peerId !== peerId) {
        onPeerDiscovered(data.peerId);
      }
    });

    channel?.bind(`client-signal-${peerId}`, (data: { signal: any, senderPeerId: string }) => {
      onSignalReceived(data.signal);
    });
  }

  function stop(): void {
    if (pusher) {
      pusher.unsubscribe('peer-discovery');
    }
    if (pusher) {
      pusher.disconnect();
    }
  }

  async function sendSignal(targetPeerId: string, signal: any): Promise<void> {
    if (!channel) throw new Error("Channel is not initialized");
    channel.trigger(`client-signal-${targetPeerId}`, {
      signal,
      senderPeerId: peerId,
    });
  }

  return { peerId, start, stop, sendSignal };
}