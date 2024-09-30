const CHUNK_SIZE = 16384; // 16 KB chunks

// Define the type for the callback function
type OnChunkCallback = (chunk: { index: number; data: ArrayBuffer; last: boolean }) => void;

export function createFileChunker(file: File, onChunk: OnChunkCallback) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const reader = new FileReader();

  function readNextChunk(chunkIndex: number): void {
    if (chunkIndex >= totalChunks) {
      return; 
    }

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    reader.onload = (e) => {
      onChunk({
        index: chunkIndex,
        data: e.target?.result as ArrayBuffer,
        last: chunkIndex === totalChunks - 1
      });
      readNextChunk(chunkIndex + 1);
    };

    reader.readAsArrayBuffer(chunk);
  }

  readNextChunk(0); // Start reading chunks
}
