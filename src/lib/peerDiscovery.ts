import Pusher from 'pusher-js';

export function createPeerDiscovery(
  onPeerDiscovered: (peerId: string) => void,
  onSignalReceived: (signal: any) => void
) {
  const peerId: string = Math.random().toString(36).substr(2, 9);
  let pusher: Pusher;
  let channel: Pusher.Channel;

  function start(): void {
    pusher = new Pusher('YOUR_PUSHER_APP_KEY', {
      cluster: 'YOUR_PUSHER_APP_CLUSTER',
    });

    // Type casting here to resolve type issue
    channel = pusher.subscribe('peer-discovery') as unknown as Pusher.Channel;

    channel.bind('peer-announced', (data: { peerId: string }) => {
      if (data.peerId !== peerId) {
        onPeerDiscovered(data.peerId);
      }
    });

    channel.bind(`signal-${peerId}`, (data: { signal: any }) => {
      onSignalReceived(data.signal);
    });

    // Announce this peer
    channel.trigger('client-peer-announced', { peerId });
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
    channel.trigger(`client-signal-${targetPeerId}`, {
      signal,
      senderPeerId: peerId,
    });
  }

  return { peerId, start, stop, sendSignal };
}
1