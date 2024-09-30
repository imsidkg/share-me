import { webrtcConfig } from "@/config/webrtc";


export function createPeerConnection(onDataChannel: (channel: RTCDataChannel) => void) {
 
  const peerConnection: RTCPeerConnection = new RTCPeerConnection(webrtcConfig);
  let dataChannel: RTCDataChannel | null = null;


  peerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
    dataChannel = event.channel;
    setupDataChannel(dataChannel);
    onDataChannel(dataChannel);
  };

  
  async function createOffer(): Promise<RTCSessionDescriptionInit> {
    dataChannel = peerConnection.createDataChannel('file transfer');
    setupDataChannel(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  }

 
  async function handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  
  async function handleOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  
  function close(): void {
    if (dataChannel) {
      dataChannel.close();
    }
    peerConnection.close();
  }

 
  function setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => console.log('Data channel is open');
    channel.onclose = () => console.log('Data channel is closed');
    channel.onerror = (error: Event) => console.error('Data channel error:', error);
  }

  
  return {
    createOffer,
    handleAnswer,
    handleOffer,
    close
  };
}
