'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { createFileChunker } from '@/lib/fileChunker';
import { createPeerConnection } from '@/lib/peerConnection';
import { createPeerDiscovery } from '@/lib/peerDiscovery';

interface FileChunk {
  index: number;
  data: ArrayBuffer;
  last: boolean;
}

interface FileTransferMessage {
  type: 'file-start' | 'file-chunk' | 'file-end';
  fileName?: string;
  chunk?: FileChunk;
  totalChunks?: number;
}

interface PeerDiscovery {
  start: () => void;
  stop: () => void;
  sendSignal: (peerId: string, signal: RTCSessionDescriptionInit) => void;
}

interface CustomPeerConnection {
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  handleAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  handleOffer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit>;
  close: () => void;
  createDataChannel?: (label: string) => RTCDataChannel;
}

const Home: React.FC = () => {
  const [peers, setPeers] = useState<string[]>([]);
  const [peerConnection, setPeerConnection] = useState<CustomPeerConnection | null>(null);
  const [peerDiscovery, setPeerDiscovery] = useState<PeerDiscovery | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receivedFileChunks, setReceivedFileChunks] = useState<FileChunk[]>([]);
  const [isReceivingFile, setIsReceivingFile] = useState<boolean>(false);
  const [receivedFileName, setReceivedFileName] = useState<string>('');
  const [totalChunks, setTotalChunks] = useState<number>(0);

  const handlePeerDiscovered = useCallback((peerId: string) => {
    setPeers(prevPeers => [...prevPeers, peerId]);
  }, []);

  const handleSignalReceived = useCallback(async (signal: RTCSessionDescriptionInit & { senderPeerId?: string }) => {
    if (!peerConnection) return;

    if (signal.type === 'offer') {
      const answer = await peerConnection.handleOffer(signal);
      peerDiscovery?.sendSignal(signal.senderPeerId || '', answer);
    } else if (signal.type === 'answer') {
      await peerConnection.handleAnswer(signal);
    }
  }, [peerConnection, peerDiscovery]);

  const handleDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.onmessage = (event: MessageEvent) => {
      const message: FileTransferMessage = JSON.parse(event.data);
      if (message.type === 'file-start') {
        setIsReceivingFile(true);
        setReceivedFileName(message.fileName || 'unknown');
        setReceivedFileChunks([]);
        setTotalChunks(message.totalChunks || 0);
      } else if (message.type === 'file-chunk' && message.chunk) {
        setReceivedFileChunks(chunks => [...chunks, message.chunk as FileChunk]);
      } else if (message.type === 'file-end') {
        setIsReceivingFile(false);
        const file = new Blob(receivedFileChunks.map(chunk => chunk.data));
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = receivedFileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
  }, [receivedFileChunks, receivedFileName]);

  useEffect(() => {
    const pc = createPeerConnection(handleDataChannel);
    setPeerConnection(pc);

    const pd = createPeerDiscovery(handlePeerDiscovered, handleSignalReceived);
    setPeerDiscovery(pd);
    pd.start();

    return () => {
      pc.close();
      pd.stop();
    };
  }, [handlePeerDiscovered, handleSignalReceived, handleDataChannel]);

  const initiateConnection = async (peerId: string) => {
    if (!peerConnection) return;

    const offer = await peerConnection.createOffer();
    peerDiscovery?.sendSignal(peerId, offer);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const sendFile = async (peerId: string) => {
    if (!selectedFile || !peerConnection || !peerConnection.createDataChannel) return;

    await initiateConnection(peerId);

    const dataChannel = peerConnection.createDataChannel('fileTransfer');
    dataChannel.onopen = () => {
      const totalChunks = Math.ceil(selectedFile.size / 16384); // Assuming CHUNK_SIZE is 16384

      dataChannel.send(JSON.stringify({
        type: 'file-start',
        fileName: selectedFile.name,
        totalChunks
      }));

      createFileChunker(selectedFile, (chunk) => {
        dataChannel.send(JSON.stringify({
          type: 'file-chunk',
          chunk
        }));

        if (chunk.last) {
          dataChannel.send(JSON.stringify({
            type: 'file-end'
          }));
        }
      });
    };

    await initiateConnection(peerId);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WebRTC File Sharing</h1>
      
      <div className="mb-4">
        <input type="file" onChange={handleFileSelect} className="mb-2" />
        {selectedFile && (
          <p className="text-sm text-gray-600">Selected file: {selectedFile.name}</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">Connected Peers:</h2>
      <ul className="mb-4">
        {peers.map(peerId => (
          <li key={peerId} className="flex items-center justify-between mb-2">
            <span>{peerId}</span>
            <button
              onClick={() => sendFile(peerId)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
              disabled={!selectedFile}
            >
              Send File
            </button>
          </li>
        ))}
      </ul>

      {isReceivingFile && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">Receiving file: {receivedFileName}</p>
          <div className="w-full bg-gray-200 rounded">
            <div
              className="bg-blue-500 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded"
              style={{ width: `${(receivedFileChunks.length / totalChunks) * 100}%` }}
            >
              {Math.round((receivedFileChunks.length / totalChunks) * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;