
import Pusher from 'pusher-js';

export function createPeerDiscovery(onPeerDiscovered, onSignalReceived) {
  const peerId = Math.random().toString(36).substr(2, 9);
  let pusher;
  let channel;

  function start() {
    pusher = new Pusher('YOUR_PUSHER_APP_KEY', {
      cluster: 'YOUR_PUSHER_APP_CLUSTER',
    });

    channel = pusher.subscribe('peer-discovery');

    channel.bind('peer-announced', (data) => {
      if (data.peerId !== peerId) {
        onPeerDiscovered(data.peerId);
      }
    });

    channel.bind(`signal-${peerId}`, (data) => {
      onSignalReceived(data.signal);
    });

    // Announce this peer
    channel.trigger('client-peer-announced', { peerId });
  }

  function stop() {
    if (channel) {
      channel.unbind_all();
      channel.unsubscribe();
    }
    if (pusher) {
      pusher.disconnect();
    }
  }

  async function sendSignal(targetPeerId, signal) {
    channel.trigger(`client-signal-${targetPeerId}`, { 
      signal, 
      senderPeerId: peerId 
    });
  }

  return { peerId, start, stop, sendSignal };
}