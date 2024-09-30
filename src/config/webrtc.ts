// config/webrtc.js

export const webrtcConfig = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
     
    ],
    iceCandidatePoolSize: 10,
  };
  
  // Optional: Additional WebRTC-related settings
  export const webrtcOptions = {
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  };
  
  // Optional: Data channel configuration
  export const dataChannelConfig = {
    ordered: true,
    maxRetransmits: 3,
  };