import { useState, useEffect, useRef } from "react";
import { useNocturned } from "../hooks/useNocturned";

export default function AlbumArtTest() {
  const [status, setStatus] = useState("idle"); // idle, requesting, transferring, complete
  const [albumArtUrl, setAlbumArtUrl] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [transferTime, setTransferTime] = useState(null);
  const [displayTime, setDisplayTime] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const { ws, addMessageListener, removeMessageListener } = useNocturned();
  const imageRef = useRef(null);

  useEffect(() => {
    const listenerId = addMessageListener("album-art-test", (data) => {
      console.log("AlbumArtTest received message:", data);
      console.log("Message type:", data.type);
      
      // Handle test-specific WebSocket events
      if (data.type === "test/album_art_requested") {
        setStatus("requesting");
        setTransferProgress(0);
      } else if (data.type === "test/album_art_transfer_start") {
        setStatus("transferring");
        setStartTime(Date.now());
        setAlbumArtUrl(null);
        setTransferTime(null);
        setDisplayTime(null);
        setMetadata(null);
        setTransferProgress(0);
        
        // Store initial metadata
        if (data.payload) {
          setMetadata({
            size: data.payload.size,
            totalChunks: data.payload.total_chunks,
            checksum: data.payload.checksum
          });
        }
      } else if (data.type === "test/album_art_chunk_received") {
        // Update progress
        if (data.payload && data.payload.progress_percent) {
          setTransferProgress(data.payload.progress_percent);
        }
      } else if (data.type === "test/album_art_transfer_complete") {
        const now = Date.now();
        const elapsed = now - startTime;
        setTransferTime(elapsed);
        setStatus("complete");
        setTransferProgress(100);
        
        // Update metadata with complete info
        if (data.payload) {
          setMetadata(prev => ({
            ...prev,
            size: data.payload.size,
            format: data.payload.format,
            width: data.payload.width,
            height: data.payload.height,
            totalChunks: data.payload.total_chunks,
            checksum: data.payload.checksum,
            transferTimeMs: data.payload.transfer_time_ms
          }));
        }
        
        // Set the test album art URL immediately
        const imageUrl = "http://localhost:5000/api/test/album-art/image?t=" + Date.now();
        setAlbumArtUrl(imageUrl);
        setDisplayTime(Date.now() - startTime);
      } else if (data.type === "test/album_art_transfer_failed") {
        setStatus("failed");
        setTransferProgress(0);
        console.error("Test album art transfer failed:", data.payload?.reason);
      }
    });

    return () => removeMessageListener(listenerId);
  }, [addMessageListener, removeMessageListener, startTime]);

  const requestAlbumArt = async () => {
    setStatus("requesting");
    setStartTime(Date.now());
    setAlbumArtUrl(null);
    setTransferTime(null);
    setDisplayTime(null);
    setTransferProgress(0);
    
    try {
      const response = await fetch("http://localhost:5000/api/test/album-art/request", {
        method: "POST"
      });
      
      if (!response.ok) {
        console.error("Failed to request test album art");
        setStatus("failed");
      }
    } catch (error) {
      console.error("Error requesting test album art:", error);
      setStatus("failed");
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "requesting":
        return "bg-yellow-600";
      case "transferring":
        return "bg-green-600";
      case "complete":
        return "bg-blue-600";
      case "failed":
        return "bg-red-600";
      default:
        return "bg-gray-900";
    }
  };

  return (
    <div className={`h-full w-full transition-colors duration-300 ${getBackgroundColor()} flex flex-col items-center justify-center`}>
      <div className="max-w-4xl w-full px-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-8">Album Art Transfer Test</h1>
        
        <div className="mb-8">
          <button
            onClick={requestAlbumArt}
            className="px-8 py-4 bg-white text-gray-900 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={status === "requesting" || status === "transferring"}
          >
            Request Test Album Art
          </button>
        </div>
        
        <div className="text-white text-xl mb-8 space-y-2">
          <p>Status: {status.charAt(0).toUpperCase() + status.slice(1)}</p>
          
          {status === "transferring" && (
            <div className="mt-4">
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-300 ease-out"
                  style={{ width: `${transferProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm">{transferProgress}% Complete</p>
            </div>
          )}
          
          {transferTime && (
            <p>Transfer Time: {transferTime}ms</p>
          )}
          {displayTime && (
            <p>Total Time to Display: {displayTime}ms</p>
          )}
          
          {metadata && (
            <div className="mt-4 p-4 bg-black/30 rounded-lg">
              <h3 className="text-2xl font-semibold mb-2">Image Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-left max-w-md mx-auto">
                <div>Format:</div>
                <div className="font-mono">{metadata.format}</div>
                
                <div>Dimensions:</div>
                <div className="font-mono">{metadata.width} × {metadata.height}px</div>
                
                <div>File Size:</div>
                <div className="font-mono">{(metadata.size / 1024).toFixed(1)}KB</div>
                
                <div>Total Chunks:</div>
                <div className="font-mono">{metadata.totalChunks}</div>
                
                {metadata.transferTimeMs && (
                  <>
                    <div>BLE Transfer:</div>
                    <div className="font-mono">{metadata.transferTimeMs}ms</div>
                  </>
                )}
                
                {metadata.checksum && (
                  <>
                    <div>Checksum:</div>
                    <div className="font-mono text-sm truncate" title={metadata.checksum}>
                      {metadata.checksum.substring(0, 16)}...
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {albumArtUrl && (
          <div className="flex justify-center">
            <img 
              ref={imageRef}
              src={albumArtUrl} 
              alt="Album Art" 
              className="w-80 h-80 rounded-lg shadow-2xl"
              onLoad={() => {
                console.log("Image loaded");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}